import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Db } from './db';

/**
 * Recomputes the stored fuel-chain values for one vehicle.
 *
 *   tripDistance = odometer - previous odometer
 *   efficiency   = distance since the last full tank / litres burned since it
 *
 * Both depend on the entries *around* them, so any create, edit, archive or
 * restore has to re-walk the whole (active) chain, not just the touched row.
 * Backdating an entry therefore fixes every later entry automatically.
 *
 * Rules that keep the numbers honest:
 *  - partial fills accumulate volume but never report their own efficiency;
 *  - `missedPreviousEntry` breaks the chain: distance and volume are unknown,
 *    so that entry reports neither, and it becomes the new reference point;
 *  - archived entries are skipped entirely, so they cannot distort the chain.
 */
@Injectable()
export class FuelChainService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the number of rows that actually changed. */
  async recompute(vehicleId: string, db: Db = this.prisma): Promise<number> {
    const entries = await db.fuelEntry.findMany({
      where: { vehicleId, isActive: true },
      orderBy: [{ filledAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        odometer: true,
        volume: true,
        isFullTank: true,
        missedPreviousEntry: true,
        tripDistance: true,
        efficiency: true,
      },
    });

    let previousOdometer: Prisma.Decimal | null = null;
    let lastFullOdometer: Prisma.Decimal | null = null;
    let volumeSinceFull = new Prisma.Decimal(0);

    const changes: Prisma.PrismaPromise<unknown>[] = [];

    for (const entry of entries) {
      let tripDistance: Prisma.Decimal | null = null;

      if (previousOdometer !== null && !entry.missedPreviousEntry) {
        const distance = entry.odometer.minus(previousOdometer);
        if (distance.gt(0)) tripDistance = distance;
      }

      if (entry.missedPreviousEntry) {
        lastFullOdometer = null;
        volumeSinceFull = new Prisma.Decimal(0);
      }

      let efficiency: Prisma.Decimal | null = null;

      if (entry.isFullTank) {
        if (lastFullOdometer !== null && tripDistance !== null) {
          const distance = entry.odometer.minus(lastFullOdometer);
          const volume = volumeSinceFull.plus(entry.volume);

          if (distance.gt(0) && volume.gt(0)) {
            efficiency = distance.dividedBy(volume).toDecimalPlaces(3);
          }
        }

        lastFullOdometer = entry.odometer;
        volumeSinceFull = new Prisma.Decimal(0);
      } else {
        // A partial fill still counts towards the next full tank's consumption.
        volumeSinceFull = volumeSinceFull.plus(entry.volume);
      }

      previousOdometer = entry.odometer;

      if (
        !sameDecimal(entry.tripDistance, tripDistance) ||
        !sameDecimal(entry.efficiency, efficiency)
      ) {
        changes.push(
          db.fuelEntry.update({
            where: { id: entry.id },
            data: { tripDistance, efficiency },
          }),
        );
      }
    }

    if (changes.length > 0) {
      await Promise.all(changes);
    }

    return changes.length;
  }
}

function sameDecimal(
  a: Prisma.Decimal | null,
  b: Prisma.Decimal | null,
): boolean {
  if (a === null || b === null) return a === b;
  return a.eq(b);
}
