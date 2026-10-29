import { Injectable } from '@nestjs/common';
import { MaintenancePlan } from '@prisma/client';
import { addMonths } from '../common/utils/dates';
import { PrismaService } from '../prisma/prisma.service';
import { Db } from './db';

/**
 * Keeps the two stored due-caches on a plan in sync.
 *
 *   nextDueAt       = lastDoneAt + intervalMonths
 *   nextDueDistance = lastDoneOdometer + intervalDistance
 *
 * The distance side needs `lastDoneOdometer`: without the odometer the job was
 * done at, "every 10,000 km" has no anchor. That column is why it exists.
 * Since it is a fixed anchor, driving more does not change it — only completing
 * the job (or editing the plan) does.
 */
@Injectable()
export class MaintenanceDueService {
  constructor(private readonly prisma: PrismaService) {}

  async recompute(
    planId: string,
    db: Db = this.prisma,
  ): Promise<MaintenancePlan | null> {
    const plan = await db.maintenancePlan.findUnique({ where: { id: planId } });
    if (!plan) return null;

    return db.maintenancePlan.update({
      where: { id: plan.id },
      data: this.dueFor(plan),
    });
  }

  dueFor(plan: {
    lastDoneAt: Date | null;
    lastDoneOdometer: { toString(): string } | null;
    intervalMonths: number | null;
    intervalDistance: number | null;
  }): { nextDueAt: Date | null; nextDueDistance: number | null } {
    const nextDueAt =
      plan.lastDoneAt && plan.intervalMonths
        ? addMonths(plan.lastDoneAt, plan.intervalMonths)
        : null;

    const nextDueDistance =
      plan.lastDoneOdometer !== null && plan.intervalDistance !== null
        ? Math.round(
            Number(plan.lastDoneOdometer.toString()) + plan.intervalDistance,
          )
        : null;

    return { nextDueAt, nextDueDistance };
  }
}
