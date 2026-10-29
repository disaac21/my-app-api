import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated, Paginated } from '../common/types';
import { FuelChainService } from '../derived/fuel-chain.service';
import { OdometerService } from '../derived/odometer.service';
import { VehicleGuardService } from '../derived/vehicle-guard.service';
import { ParamsService } from '../params/params.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFuelEntryDto,
  QueryFuelEntriesDto,
  UpdateFuelEntryDto,
} from './dto/fuel-entry.dto';

/**
 * Fuel entries carry three stored derived values:
 *
 *   pricePerUnit — self-contained (priceTotal / volume)
 *   tripDistance — depends on the previous entry
 *   efficiency   — depends on the last full tank and every fill since
 *
 * So every create, edit, archive and restore re-walks the whole chain for that
 * vehicle, not just the row that changed. That is what makes backdating and
 * deletion safe.
 */
@Injectable()
export class FuelEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly params: ParamsService,
    private readonly guard: VehicleGuardService,
    private readonly chain: FuelChainService,
    private readonly odometer: OdometerService,
  ) {}

  async findAll(query: QueryFuelEntriesDto): Promise<Paginated<unknown>> {
    const where: Prisma.FuelEntryWhereInput = {
      isActive: query.isActive,
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.from || query.to
        ? {
            filledAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.fuelEntry.count({ where }),
      this.prisma.fuelEntry.findMany({
        where,
        orderBy: [{ filledAt: 'desc' }, { createdAt: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
    ]);

    return paginated(rows, total, query.limit, query.offset);
  }

  async findOne(id: string) {
    const entry = await this.prisma.fuelEntry.findUnique({ where: { id } });

    if (!entry) {
      throw new NotFoundException(`Fuel entry "${id}" does not exist.`);
    }

    return entry;
  }

  async create(dto: CreateFuelEntryDto) {
    await this.guard.ensureActive(dto.vehicleId);
    await this.params.assertCode('FUEL_TYPE', dto.fuelType, 'fuelType');

    const pricePerUnit = divide(dto.priceTotal, dto.volume);

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.fuelEntry.create({
        data: { ...dto, pricePerUnit },
      });

      await this.chain.recompute(dto.vehicleId, tx);
      await this.odometer.recompute(dto.vehicleId, tx);

      return tx.fuelEntry.findUniqueOrThrow({ where: { id: entry.id } });
    });
  }

  async update(id: string, dto: UpdateFuelEntryDto) {
    const existing = await this.prisma.fuelEntry.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Fuel entry "${id}" does not exist.`);
    }

    await this.params.assertCode('FUEL_TYPE', dto.fuelType, 'fuelType');

    const priceTotal = dto.priceTotal ?? Number(existing.priceTotal);
    const volume = dto.volume ?? Number(existing.volume);
    const pricePerUnit = divide(priceTotal, volume);

    return this.prisma.$transaction(async (tx) => {
      await tx.fuelEntry.update({
        where: { id },
        data: { ...dto, pricePerUnit },
      });

      await this.chain.recompute(existing.vehicleId, tx);
      await this.odometer.recompute(existing.vehicleId, tx);

      return tx.fuelEntry.findUniqueOrThrow({ where: { id } });
    });
  }

  /** Archive; the chain is re-walked without this entry. */
  async remove(id: string) {
    return this.setActive(id, false);
  }

  async restore(id: string) {
    return this.setActive(id, true);
  }

  private async setActive(id: string, isActive: boolean) {
    const existing = await this.prisma.fuelEntry.findUnique({
      where: { id },
      select: { id: true, vehicleId: true },
    });

    if (!existing) {
      throw new NotFoundException(`Fuel entry "${id}" does not exist.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.fuelEntry.update({
        where: { id },
        data: { isActive },
      });

      await this.chain.recompute(existing.vehicleId, tx);
      await this.odometer.recompute(existing.vehicleId, tx);

      return entry;
    });
  }
}

function divide(priceTotal: number, volume: number): Prisma.Decimal {
  if (volume <= 0) {
    throw new BadRequestException('volume must be greater than 0.');
  }

  return new Prisma.Decimal(priceTotal)
    .dividedBy(new Prisma.Decimal(volume))
    .toDecimalPlaces(4);
}
