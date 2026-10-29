import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ParamOption } from './param-option';
import { PARAM_KEYS, ParamKey, isParamKey } from './param-keys';
import { PatchParamDto, ReplaceParamDto } from './dto/param.dto';

/**
 * `params` is a key/value registry: one row per kind, value is an ordered array
 * of options. This service is the single place that reads it, and the only
 * writer.
 *
 * Because options are referenced by plain code strings (Postgres cannot foreign
 * key into a JSON array), two things have to happen here instead of in the DB:
 *   1. every write validates the code against the array (`assertCode`);
 *   2. removing an option that is still referenced is refused (`assertUnused`).
 *
 * The 11 rows are tiny, so the whole registry is cached in memory and retyped
 * from the DB on every write.
 */
@Injectable()
export class ParamsService {
  private cache: Map<string, ParamOption[]> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Record<string, ParamOption[]>> {
    const registry = await this.load();
    const result: Record<string, ParamOption[]> = {};

    for (const key of PARAM_KEYS) {
      result[key] = registry.get(key) ?? [];
    }

    return result;
  }

  async findOne(key: string): Promise<{ key: string; value: ParamOption[] }> {
    return { key, value: await this.options(key) };
  }

  /** Throws 404 for an unknown or unseeded kind. */
  async options(key: string): Promise<ParamOption[]> {
    this.assertKnown(key);

    const registry = await this.load();
    const value = registry.get(key);

    if (!value) {
      throw new NotFoundException(`Param "${key}" has not been seeded.`);
    }

    return value;
  }

  /**
   * Validates a code against its kind. Call this from every write path that
   * stores a param code — it is the replacement for the foreign keys we gave up.
   */
  async assertCode(
    key: ParamKey,
    code: string | null | undefined,
    field: string,
  ): Promise<void> {
    if (code === null || code === undefined) return;

    const options = await this.options(key);

    if (!options.some((option) => option.key === code)) {
      throw new BadRequestException(
        `Unknown ${field} "${code}". Valid values: ${options
          .map((option) => option.key)
          .join(', ')}.`,
      );
    }
  }

  async assertCodes(
    key: ParamKey,
    codes: (string | null | undefined)[],
    field: string,
  ): Promise<void> {
    for (const code of codes) {
      await this.assertCode(key, code, field);
    }
  }

  async option(key: ParamKey, code: string): Promise<ParamOption | undefined> {
    const options = await this.options(key);
    return options.find((option) => option.key === code);
  }

  async label(
    key: ParamKey,
    code: string | null | undefined,
  ): Promise<string | null> {
    if (!code) return null;
    const option = await this.option(key, code);
    return option?.label ?? code;
  }

  /** PUT /params/:key — replace the array. */
  async replace(
    key: string,
    dto: ReplaceParamDto,
  ): Promise<{ key: string; value: ParamOption[] }> {
    this.assertKnown(key);

    const next = this.validateOptions(dto.options);
    const previous = await this.options(key);

    await this.assertUnused(
      key,
      previous
        .filter((old) => !next.some((option) => option.key === old.key))
        .map((old) => old.key),
    );
    await this.assertGroupsValid(next);

    await this.write(key, next);

    return { key, value: next };
  }

  /** PATCH /params/:key — append, relabel or remove individual options. */
  async patch(
    key: string,
    dto: PatchParamDto,
  ): Promise<{ key: string; value: ParamOption[] }> {
    this.assertKnown(key);

    const current = await this.options(key);
    const removed = dto.remove ?? [];

    await this.assertUnused(key, removed);

    const next = current.filter((option) => !removed.includes(option.key));

    for (const change of dto.update ?? []) {
      const index = next.findIndex((option) => option.key === change.key);

      if (index === -1) {
        throw new BadRequestException(
          `"${change.key}" is not an option of "${key}".`,
        );
      }

      next[index] = {
        ...next[index],
        ...(change.label !== undefined ? { label: change.label } : {}),
        ...(change.symbol !== undefined ? { symbol: change.symbol } : {}),
        ...(change.groups !== undefined ? { groups: change.groups } : {}),
      };
    }

    for (const addition of dto.append ?? []) {
      if (next.some((option) => option.key === addition.key)) {
        throw new BadRequestException(
          `"${addition.key}" is already an option of "${key}".`,
        );
      }

      next.push({
        key: addition.key,
        label: addition.label,
        ...(addition.symbol !== undefined ? { symbol: addition.symbol } : {}),
        ...(addition.groups !== undefined ? { groups: addition.groups } : {}),
      });
    }

    if (next.length === 0) {
      throw new BadRequestException(`"${key}" must keep at least one option.`);
    }

    await this.assertGroupsValid(next);
    await this.write(key, next);

    return { key, value: next };
  }

  private assertKnown(key: string): asserts key is ParamKey {
    if (!isParamKey(key)) {
      throw new NotFoundException(
        `Unknown param "${key}". Known kinds: ${PARAM_KEYS.join(', ')}.`,
      );
    }
  }

  private async load(): Promise<Map<string, ParamOption[]>> {
    if (this.cache) return this.cache;

    const rows = await this.prisma.param.findMany();
    this.cache = new Map(
      rows.map((row) => [row.key, row.value as unknown as ParamOption[]]),
    );

    return this.cache;
  }

  private async write(key: string, options: ParamOption[]): Promise<void> {
    const value = options as unknown as Prisma.InputJsonValue;

    await this.prisma.param.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    this.cache = null;
  }

  private validateOptions(options: ParamOption[]): ParamOption[] {
    const seen = new Set<string>();

    for (const option of options) {
      if (seen.has(option.key)) {
        throw new BadRequestException(
          `Duplicate option key "${option.key}" in the same array.`,
        );
      }
      seen.add(option.key);

      if (!option.label?.trim()) {
        throw new BadRequestException(`Option "${option.key}" needs a label.`);
      }
    }

    return options;
  }

  private async assertGroupsValid(options: ParamOption[]): Promise<void> {
    const withGroups = options.filter((option) => option.groups !== undefined);
    if (withGroups.length === 0) return;

    const groups = await this.codesFor('DOCUMENT_GROUP');

    for (const option of withGroups) {
      for (const group of option.groups ?? []) {
        if (!groups.includes(group)) {
          throw new BadRequestException(
            `Option "${option.key}" references unknown document group "${group}". Valid values: ${groups.join(', ')}.`,
          );
        }
      }
    }
  }

  private async codesFor(key: ParamKey): Promise<string[]> {
    const options = await this.options(key);
    return options.map((option) => option.key);
  }

  /**
   * Refuses to remove a code that rows still point at. Without this, deleting
   * "DIESEL" from the registry silently orphans every diesel vehicle.
   */
  private async assertUnused(key: ParamKey, codes: string[]): Promise<void> {
    for (const code of codes) {
      const used = await this.usageOf(key, code);

      if (used > 0) {
        throw new ConflictException(
          `Cannot remove "${code}" from ${key}: ${used} record(s) still reference it.`,
        );
      }
    }
  }

  private async usageOf(key: ParamKey, code: string): Promise<number> {
    const prisma = this.prisma;

    switch (key) {
      case 'FUEL_TYPE':
        return (
          (await prisma.vehicle.count({ where: { fuelType: code } })) +
          (await prisma.fuelEntry.count({ where: { fuelType: code } }))
        );

      case 'TRANSMISSION_TYPE':
        return prisma.vehicle.count({ where: { transmission: code } });

      case 'DRIVE_TYPE':
        return prisma.vehicle.count({ where: { driveType: code } });

      case 'MAINTENANCE_TYPE':
        return (
          (await prisma.maintenanceEntry.count({ where: { type: code } })) +
          (await prisma.maintenancePlan.count({ where: { type: code } }))
        );

      case 'DOCUMENT_GROUP':
        return prisma.vehicleDocument.count({ where: { group: code } });

      case 'DOCUMENT_TYPE':
        return prisma.vehicleDocument.count({ where: { type: code } });

      case 'READING_SOURCE':
        return prisma.vehicleReading.count({ where: { source: code } });

      // Units and currencies are not referenced by a column yet.
      default:
        return 0;
    }
  }
}
