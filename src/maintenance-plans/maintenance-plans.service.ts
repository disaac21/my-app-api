import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MaintenancePlan, Prisma } from '@prisma/client';
import { paginated, Paginated } from '../common/types';
import { addDays } from '../common/utils/dates';
import { Db } from '../derived/db';
import { MaintenanceDueService } from '../derived/maintenance-due.service';
import { OdometerService } from '../derived/odometer.service';
import { VehicleGuardService } from '../derived/vehicle-guard.service';
import { ParamsService } from '../params/params.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CompleteMaintenancePlanDto,
  CreateMaintenancePlanDto,
  DueMaintenancePlansQueryDto,
  QueryMaintenancePlansDto,
  UpdateMaintenancePlanDto,
} from './dto/maintenance-plan.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Why a plan landed in a bucket. Either anchor can trigger it. */
type DueReason = 'DATE' | 'DISTANCE';

type DuePlan = MaintenancePlan & {
  vehicle: {
    id: string;
    plate: string;
    nickname: string | null;
    currentOdometer: Prisma.Decimal | null;
  };
  daysUntilDue: number | null;
  distanceUntilDue: number | null;
  status: 'DUE' | 'DUE_SOON';
  reasons: DueReason[];
};

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
      // An archived vehicle is hidden from lists, so its plans are too.
      ...(query.includeArchivedVehicles
        ? {}
        : { vehicle: { is: { isActive: true } } }),
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

  /**
   * The dashboard query: what needs attention now, and what will soon.
   *
   * A plan can be due on either axis, so it is split into two buckets rather
   * than filtered by one date column:
   *
   *   due          — nextDueAt has passed, or the odometer has reached
   *                  nextDueDistance (or both)
   *   nextToBeDue  — not due yet, but within `horizonDays` (default 30) or
   *                  `horizonDistance` (default 500 km ≈ 300 miles)
   *
   * Distance is only comparable when the vehicle has an odometer reading; a
   * vehicle with no readings simply has no distance status.
   */
  async findDue(query: DueMaintenancePlansQueryDto) {
    const now = new Date();
    const horizonEnd = addDays(now, query.horizonDays);

    const plans = await this.prisma.maintenancePlan.findMany({
      where: {
        isActive: true,
        ...(query.includeArchivedVehicles
          ? {}
          : { vehicle: { is: { isActive: true } } }),
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      },
      include: {
        vehicle: {
          select: {
            id: true,
            plate: true,
            nickname: true,
            currentOdometer: true,
          },
        },
      },
      orderBy: [{ nextDueAt: 'asc' }, { createdAt: 'asc' }],
    });

    const due: DuePlan[] = [];
    const nextToBeDue: DuePlan[] = [];

    for (const plan of plans) {
      const daysUntilDue = plan.nextDueAt
        ? Math.ceil((plan.nextDueAt.getTime() - now.getTime()) / DAY_MS)
        : null;

      const distanceUntilDue =
        plan.nextDueDistance !== null && plan.vehicle.currentOdometer !== null
          ? plan.nextDueDistance -
            Math.round(Number(plan.vehicle.currentOdometer.toString()))
          : null;

      const overdue: DueReason[] = [];
      if (daysUntilDue !== null && daysUntilDue <= 0) overdue.push('DATE');
      if (distanceUntilDue !== null && distanceUntilDue <= 0) {
        overdue.push('DISTANCE');
      }

      const item = { ...plan, daysUntilDue, distanceUntilDue };

      if (overdue.length > 0) {
        due.push({ ...item, status: 'DUE', reasons: overdue });
        continue;
      }

      const soon: DueReason[] = [];
      if (
        plan.nextDueAt &&
        daysUntilDue !== null &&
        daysUntilDue > 0 &&
        plan.nextDueAt <= horizonEnd
      ) {
        soon.push('DATE');
      }
      if (
        distanceUntilDue !== null &&
        distanceUntilDue > 0 &&
        distanceUntilDue <= query.horizonDistance
      ) {
        soon.push('DISTANCE');
      }

      if (soon.length > 0) {
        nextToBeDue.push({ ...item, status: 'DUE_SOON', reasons: soon });
      }
    }

    const bySoonest = (a: DuePlan, b: DuePlan) => {
      const aDays = a.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
      const bDays = b.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
      if (aDays !== bDays) return aDays - bDays;

      return (
        (a.distanceUntilDue ?? Number.MAX_SAFE_INTEGER) -
        (b.distanceUntilDue ?? Number.MAX_SAFE_INTEGER)
      );
    };

    due.sort(bySoonest);
    nextToBeDue.sort(bySoonest);

    return {
      due,
      nextToBeDue,
      meta: {
        checkedAt: now.toISOString(),
        horizonDays: query.horizonDays,
        horizonDistanceKm: query.horizonDistance,
      },
    };
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
    await this.guard.ensureActive(existing.vehicleId);

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
   * A hand-logged maintenance entry moves the matching plan's anchor forward,
   * so logging a job by hand does not leave the schedule stale.
   *
   * It only ever moves forward. Backfilling old history must not rewind a
   * schedule, and a manual PATCH of the plan stays authoritative until a newer
   * job is recorded. (The corollary: archiving the entry that advanced a plan
   * leaves the plan where it is — PATCH the plan if it was a mistake.)
   *
   * Matching is by vehicle + type, and every active plan for that pair is
   * advanced, so two plans of the same type stay in sync.
   */
  async advanceFromEntry(
    entry: {
      vehicleId: string;
      type: string;
      performedAt: Date;
      odometer: Prisma.Decimal | null;
    },
    db: Db = this.prisma,
  ): Promise<MaintenancePlan[]> {
    const plans = await db.maintenancePlan.findMany({
      where: { vehicleId: entry.vehicleId, type: entry.type, isActive: true },
    });

    const advanced: MaintenancePlan[] = [];

    for (const plan of plans) {
      if (!isNewerEntry(entry, plan)) continue;

      const lastDoneOdometer = entry.odometer ?? plan.lastDoneOdometer;
      const due = this.due.dueFor({
        lastDoneAt: entry.performedAt,
        lastDoneOdometer,
        intervalMonths: plan.intervalMonths,
        intervalDistance: plan.intervalDistance,
      });

      advanced.push(
        await db.maintenancePlan.update({
          where: { id: plan.id },
          data: {
            lastDoneAt: entry.performedAt,
            lastDoneOdometer,
            ...due,
          },
        }),
      );
    }

    return advanced;
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

/**
 * Would this job move the plan's anchor forward? A job on a later day always
 * wins; on the same day only a higher odometer counts. Entries with no odometer
 * can still advance the date, but never the distance anchor.
 */
function isNewerEntry(
  entry: { performedAt: Date; odometer: Prisma.Decimal | null },
  plan: { lastDoneAt: Date | null; lastDoneOdometer: Prisma.Decimal | null },
): boolean {
  if (!plan.lastDoneAt) return true;

  const entryTime = entry.performedAt.getTime();
  const planTime = plan.lastDoneAt.getTime();
  if (entryTime !== planTime) return entryTime > planTime;

  if (entry.odometer === null) return false;

  const entryOdometer = Number(entry.odometer.toString());
  const planOdometer =
    plan.lastDoneOdometer === null
      ? Number.NEGATIVE_INFINITY
      : Number(plan.lastDoneOdometer.toString());

  return entryOdometer > planOdometer;
}
