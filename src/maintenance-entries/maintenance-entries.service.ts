import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated, Paginated } from '../common/types';
import { OdometerService } from '../derived/odometer.service';
import { VehicleGuardService } from '../derived/vehicle-guard.service';
import { MaintenancePlansService } from '../maintenance-plans/maintenance-plans.service';
import { ParamsService } from '../params/params.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMaintenanceEntryDto,
  QueryMaintenanceEntriesDto,
  UpdateMaintenanceEntryDto,
} from './dto/maintenance-entry.dto';

@Injectable()
export class MaintenanceEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly params: ParamsService,
    private readonly guard: VehicleGuardService,
    private readonly odometer: OdometerService,
    private readonly plans: MaintenancePlansService,
  ) {}

  async findAll(
    query: QueryMaintenanceEntriesDto,
  ): Promise<Paginated<unknown>> {
    const where: Prisma.MaintenanceEntryWhereInput = {
      isActive: query.isActive,
      // An archived vehicle is hidden from lists, so its history is too.
      ...(query.includeArchivedVehicles
        ? {}
        : { vehicle: { is: { isActive: true } } }),
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.from || query.to
        ? {
            performedAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.maintenanceEntry.count({ where }),
      this.prisma.maintenanceEntry.findMany({
        where,
        orderBy: [{ performedAt: 'desc' }, { createdAt: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
    ]);

    return paginated(rows, total, query.limit, query.offset);
  }

  async findOne(id: string) {
    const entry = await this.prisma.maintenanceEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`Maintenance entry "${id}" does not exist.`);
    }

    return entry;
  }

  async create(dto: CreateMaintenanceEntryDto) {
    await this.guard.ensureActive(dto.vehicleId);
    await this.params.assertCode('MAINTENANCE_TYPE', dto.type, 'type');

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.maintenanceEntry.create({ data: { ...dto } });

      // Logging the job by hand is the same event as POST /plans/:id/complete,
      // so the schedule must follow. Advance-only, never rewind.
      await this.plans.advanceFromEntry(entry, tx);
      await this.odometer.recompute(dto.vehicleId, tx);

      return entry;
    });
  }

  async update(id: string, dto: UpdateMaintenanceEntryDto) {
    const existing = await this.prisma.maintenanceEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Maintenance entry "${id}" does not exist.`);
    }

    await this.guard.ensureActive(existing.vehicleId);
    await this.params.assertCode('MAINTENANCE_TYPE', dto.type, 'type');

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.maintenanceEntry.update({
        where: { id },
        data: { ...dto },
      });

      // An edited job may now be the newest one (a backfill), so re-check.
      // It may also have been corrected to an older date; the plan does not
      // rewind — PATCH the plan if the previous advance was wrong.
      if (entry.isActive) {
        await this.plans.advanceFromEntry(entry, tx);
      }

      await this.odometer.recompute(existing.vehicleId, tx);

      return entry;
    });
  }

  async remove(id: string) {
    return this.setActive(id, false);
  }

  async restore(id: string) {
    return this.setActive(id, true);
  }

  private async setActive(id: string, isActive: boolean) {
    const existing = await this.prisma.maintenanceEntry.findUnique({
      where: { id },
      select: { id: true, vehicleId: true },
    });

    if (!existing) {
      throw new NotFoundException(`Maintenance entry "${id}" does not exist.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.maintenanceEntry.update({
        where: { id },
        data: { isActive },
      });

      await this.odometer.recompute(existing.vehicleId, tx);

      return entry;
    });
  }
}
