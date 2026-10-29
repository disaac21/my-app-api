import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated, Paginated } from '../common/types';
import { toCanonicalName } from '../common/utils/strings';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateModelDto,
  QueryModelsDto,
  UpdateModelDto,
} from './dto/model.dto';

const MODEL_SELECT = {
  id: true,
  makeId: true,
  name: true,
  make: { select: { id: true, name: true } },
} satisfies Prisma.ModelSelect;

/**
 * Vehicles point at models, so a model in use can never be deleted — the
 * `Restrict` foreign key guarantees it. Unused models are hard-deleted along
 * with unused makes, keeping the catalogue tidy.
 */
@Injectable()
export class ModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryModelsDto): Promise<Paginated<unknown>> {
    const where: Prisma.ModelWhereInput = {
      ...(query.makeId ? { makeId: query.makeId } : {}),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.model.count({ where }),
      this.prisma.model.findMany({
        where,
        orderBy: [{ make: { name: 'asc' } }, { name: 'asc' }],
        skip: query.offset,
        take: query.limit,
        select: MODEL_SELECT,
      }),
    ]);

    return paginated(rows, total, query.limit, query.offset);
  }

  async findOne(id: string) {
    const model = await this.prisma.model.findUnique({
      where: { id },
      select: {
        ...MODEL_SELECT,
        _count: { select: { vehicles: true } },
      },
    });

    if (!model) throw new NotFoundException(`Model "${id}" does not exist.`);

    return model;
  }

  async create(dto: CreateModelDto) {
    await this.assertMakeExists(dto.makeId);

    const name = toCanonicalName(dto.name);
    await this.assertNameFree(dto.makeId, name);

    await this.prisma.model.create({ data: { makeId: dto.makeId, name } });

    return this.prisma.model.findFirstOrThrow({
      where: { makeId: dto.makeId, name },
      select: MODEL_SELECT,
    });
  }

  async update(id: string, dto: UpdateModelDto) {
    const existing = await this.prisma.model.findUnique({
      where: { id },
      select: { id: true, makeId: true, name: true },
    });

    if (!existing) throw new NotFoundException(`Model "${id}" does not exist.`);

    const makeId = dto.makeId ?? existing.makeId;

    if (dto.makeId && dto.makeId !== existing.makeId) {
      await this.assertMakeExists(dto.makeId);
    }

    const name =
      dto.name !== undefined ? toCanonicalName(dto.name) : existing.name;

    if (name !== existing.name || makeId !== existing.makeId) {
      await this.assertNameFree(makeId, name, id);
    }

    await this.prisma.model.update({ where: { id }, data: { makeId, name } });

    return this.findOne(id);
  }

  async remove(id: string) {
    const model = await this.prisma.model.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        make: { select: { name: true } },
        _count: { select: { vehicles: true } },
      },
    });

    if (!model) throw new NotFoundException(`Model "${id}" does not exist.`);

    if (model._count.vehicles > 0) {
      throw new ConflictException(
        `Cannot delete "${model.make.name} ${model.name}": ${model._count.vehicles} vehicle(s) still use it.`,
      );
    }

    await this.prisma.model.delete({ where: { id } });

    return { id, deleted: true };
  }

  private async findLastCreated(makeId: string, name: string) {
    const model = await this.prisma.model.findFirst({
      where: { makeId, name },
      select: MODEL_SELECT,
    });

    if (!model) throw new NotFoundException('Model was not created.');

    return model;
  }

  private async assertMakeExists(makeId: string) {
    const make = await this.prisma.make.count({ where: { id: makeId } });

    if (make === 0) {
      throw new NotFoundException(`Make "${makeId}" does not exist.`);
    }
  }

  /**
   * `@@unique([makeId, name])` is case-sensitive, so this is what actually
   * prevents "Corolla" and "corolla" under the same make.
   */
  private async assertNameFree(
    makeId: string,
    name: string,
    exceptId?: string,
  ) {
    const clash = await this.prisma.model.findFirst({
      where: {
        makeId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true, name: true },
    });

    if (clash) {
      throw new ConflictException(
        `Model "${clash.name}" already exists for this make (${clash.id}).`,
      );
    }
  }
}
