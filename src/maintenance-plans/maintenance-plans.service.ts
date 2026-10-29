import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated, Paginated } from '../common/types';
import { MaintenanceDueService } from '../derived/maintenance-due.service';
import { OdometerService } from '../derived/odometer.service';
import { VehicleGuardService } from '../derived/vehicle-guard.service';
import { ParamsService } from '../params/params.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CompleteMaintenancePlanDto,
  CreateMaintenancePlanDto,
  QueryMaintenancePlansDto,
  UpdateMaintenancePlanDto,
} from './dto/maintenance-plan.dto';

/**
 * A plan is a schedule, not a job that happened. The two due dates are stored
 * caches and are recomputed on every write here:
 *
 *   nextDueAt       = lastDoneAt + intervalMonths
 *   nextDueDistance = lastDoneOdometer + intervalDistance
 *
 * Creation with no history anchors the plan "now" (today's date, current
 * odometer), which is the only defensible baseline for "every 10,000 km".
 */
@Injectable()
export class MaintenancePlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly params: ParamsService,
    private readonly guard: VehicleGuardService,
    private readonly due: MaintenanceDueService,
    private readonly odometer: OdometerService,
  ) {}

  async findAll(query: QueryMaintenancePlansDto): Promise<Paginated<unknown>> {
    const where: Prisma.MaintenancePlanWhereInput = {
      isActive: query.isActive,
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.dueBefore ? { nextDueAt: { lte: query.dueBefore } } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.maintenancePlan.count({ where }),
      this.prisma.maintenancePlan.findMany({
        where,
        orderBy: [{ nextDueAt: 'asc' }, { createdAt: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
    ]);

    return paginated(rows, total, query.limit, query.offset);
  }

  async findOne(id: string) {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Maintenance plan "${id}" does not exist.`);
    }

    return plan;
  }

  async create(dto: CreateMaintenancePlanDto) {
    const vehicle = await this.guard.ensureActive(dto.vehicleId);
    await this.params.assertCode('MAINTENANCE_TYPE', dto.type, 'type');
    this.assertHasInterval(dto.intervalDistance, dto.intervalMonths);

    const lastDoneAt = dto.lastDoneAt ?? new Date();
    const lastDoneOdometer = dto.lastDoneOdometer ?? vehicle.currentOdometer;

    const due = this.due.dueFor({
      lastDoneAt,
      lastDoneOdometer,
      intervalMonths: dto.intervalMonths ?? null,
      intervalDistance: dto.intervalDistance ?? null,
    });

    return this.prisma.maintenancePlan.create({
      data: { ...dto, lastDoneAt, lastDoneOdometer, ...due },
    });
  }

  async update(id: string, dto: UpdateMaintenancePlanDto) {
    const existing = await this.prisma.maintenancePlan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Maintenance plan "${id}" does not exist.`);
    }

    await this.params.assertCode('MAINTENANCE_TYPE', dto.type, 'type');

    const intervalDistance =
      dto.intervalDistance !== undefined
        ? dto.intervalDistance
        : existing.intervalDistance;
    const intervalMonths =
      dto.intervalMonths !== undefined
        ? dto.intervalMonths
        : existing.intervalMonths;

    this.assertHasInterval(intervalDistance, intervalMonths);

    const lastDoneAt =
      dto.lastDoneAt !== undefined ? dto.lastDoneAt : existing.lastDoneAt;
    const lastDoneOdometer =
      dto.lastDoneOdometer !== undefined
        ? dto.lastDoneOdometer
        : existing.lastDoneOdometer;

    const due = this.due.dueFor({
      lastDoneAt,
      lastDoneOdometer,
      intervalMonths,
      intervalDistance,
    });

    return this.prisma.maintenancePlan.update({
      where: { id },
      data: { ...dto, ...due },
    });
  }

  /**
   * Marks the job done: moves the anchor forward, recomputes both due dates and
   * (by default) writes the matching MaintenanceEntry so history stays in one
   * place.
   */
  async complete(id: string, dto: CompleteMaintenancePlanDto) {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Maintenance plan "${id}" does not exist.`);
    }

    const vehicle = await this.guard.ensureActive(plan.vehicleId);

    const performedAt = dto.performedAt ?? new Date();
    const odometer = dto.odometer ?? vehicle.currentOdometer;

    const due = this.due.dueFor({
      lastDoneAt: performedAt,
      lastDoneOdometer: odometer,
      intervalMonths: plan.intervalMonths,
      intervalDistance: plan.intervalDistance,
    });

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.maintenancePlan.update({
        where: { id },
        data: { lastDoneAt: performedAt, lastDoneOdometer: odometer, ...due },
      });

      if (dto.createEntry === false) {
        return { plan: updated, entry: null };
      }

      const entry = await tx.maintenanceEntry.create({
        data: {
          vehicleId: plan.vehicleId,
          type: plan.type,
          performedAt,
          odometer,
          cost: dto.cost,
          shop: dto.shop,
          notes: dto.notes,
        },
      });

      await this.odometer.recompute(plan.vehicleId, tx);

      return { plan: updated, entry };
    });
  }

  async remove(id: string) {
    return this.setActive(id, false);
  }

  async restore(id: string) {
    return this.setActive(id, true);
  }

  private async setActive(id: string, isActive: boolean) {
    const existing = await this.prisma.maintenancePlan.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Maintenance plan "${id}" does not exist.`);
    }

    return this.prisma.maintenancePlan.update({
      where: { id },
      data: { isActive },
    });
  }

  private assertHasInterval(
    intervalDistance: number | null | undefined,
    intervalMonths: number | null | undefined,
  ) {
    const hasDistance =
      intervalDistance !== undefined && intervalDistance !== null;
    const hasMonths = intervalMonths !== undefined && intervalMonths !== null;

    if (!hasDistance && !hasMonths) {
      throw new BadRequestException(
        'A plan needs an interval: intervalDistance, intervalMonths, or both.',
      );
    }
  }
}
