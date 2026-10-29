import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated, Paginated } from '../common/types';
import { OdometerService } from '../derived/odometer.service';
import { VehicleGuardService } from '../derived/vehicle-guard.service';
import { ParamsService } from '../params/params.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVehicleReadingDto,
  QueryVehicleReadingsDto,
  UpdateVehicleReadingDto,
} from './dto/vehicle-reading.dto';

/**
 * The odometer/fuel-level timeline. Every write here can change the vehicle's
 * stored `currentOdometer`, so every write recomputes it in the same
 * transaction — including archive and restore, which are what make a mistake
 * reversible.
 */
@Injectable()
export class VehicleReadingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly params: ParamsService,
    private readonly guard: VehicleGuardService,
    private readonly odometer: OdometerService,
  ) {}

  async findAll(query: QueryVehicleReadingsDto): Promise<Paginated<unknown>> {
    const where: Prisma.VehicleReadingWhereInput = {
      isActive: query.isActive,
      // An archived vehicle is hidden from lists, so its history is too.
      ...(query.includeArchivedVehicles
        ? {}
        : { vehicle: { is: { isActive: true } } }),
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.from || query.to
        ? {
            recordedAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.vehicleReading.count({ where }),
      this.prisma.vehicleReading.findMany({
        where,
        orderBy: [{ recordedAt: 'desc' }, { createdAt: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
    ]);

    return paginated(rows, total, query.limit, query.offset);
  }

  async findOne(id: string) {
    const reading = await this.prisma.vehicleReading.findUnique({
      where: { id },
    });

    if (!reading) {
      throw new NotFoundException(`Reading "${id}" does not exist.`);
    }

    return reading;
  }

  async create(dto: CreateVehicleReadingDto) {
    await this.guard.ensureActive(dto.vehicleId);
    await this.params.assertCode('READING_SOURCE', dto.source, 'source');
    this.assertHasMeasurement(dto);

    return this.prisma.$transaction(async (tx) => {
      const reading = await tx.vehicleReading.create({ data: { ...dto } });
      await this.odometer.recompute(dto.vehicleId, tx);
      return reading;
    });
  }

  async update(id: string, dto: UpdateVehicleReadingDto) {
    const existing = await this.prisma.vehicleReading.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Reading "${id}" does not exist.`);
    }

    await this.params.assertCode('READING_SOURCE', dto.source, 'source');
    await this.guard.ensureActive(existing.vehicleId);
    this.assertHasMeasurement({
      odometer: dto.odometer !== undefined ? dto.odometer : existing.odometer,
      fuelLevelPct:
        dto.fuelLevelPct !== undefined
          ? dto.fuelLevelPct
          : existing.fuelLevelPct,
    });

    return this.prisma.$transaction(async (tx) => {
      const reading = await tx.vehicleReading.update({
        where: { id },
        data: { ...dto },
      });

      await this.odometer.recompute(existing.vehicleId, tx);

      return reading;
    });
  }

  /** Archive — the row stays, the vehicle cache is recomputed without it. */
  async remove(id: string) {
    return this.setActive(id, false);
  }

  async restore(id: string) {
    return this.setActive(id, true);
  }

  private async setActive(id: string, isActive: boolean) {
    const existing = await this.prisma.vehicleReading.findUnique({
      where: { id },
      select: { id: true, vehicleId: true, isActive: true },
    });

    if (!existing) {
      throw new NotFoundException(`Reading "${id}" does not exist.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const reading = await tx.vehicleReading.update({
        where: { id },
        data: { isActive },
      });

      await this.odometer.recompute(existing.vehicleId, tx);

      return reading;
    });
  }

  private assertHasMeasurement(measurement: {
    odometer?: unknown;
    fuelLevelPct?: unknown;
  }) {
    const hasOdometer =
      measurement.odometer !== undefined && measurement.odometer !== null;
    const hasFuelLevel =
      measurement.fuelLevelPct !== undefined &&
      measurement.fuelLevelPct !== null;

    if (!hasOdometer && !hasFuelLevel) {
      throw new BadRequestException(
        'A reading needs at least one measurement: odometer or fuelLevelPct.',
      );
    }
  }
}
