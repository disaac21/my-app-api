import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Db } from './db';

/**
 * Keeps `Vehicle.currentOdometer` correct.
 *
 * Odometers only move forward, so the vehicle's current odometer is the highest
 * value it has ever reported, whichever table reported it: a reading, a fuel
 * entry or a maintenance entry. Deriving it from the maximum (rather than
 * "set on write") means deleting or archiving the most recent record rolls the
 * value back correctly instead of leaving it stranded too high.
 *
 * Archived rows are excluded, so archiving a typo'd 500,000 km entry fixes the
 * dashboard on the next call.
 */
@Injectable()
export class OdometerService {
  constructor(private readonly prisma: PrismaService) {}

  async recompute(
    vehicleId: string,
    db: Db = this.prisma,
  ): Promise<Prisma.Decimal | null> {
    const where = { vehicleId, isActive: true };

    const [readings, fuel, maintenance] = await Promise.all([
      db.vehicleReading.aggregate({ where, _max: { odometer: true } }),
      db.fuelEntry.aggregate({ where, _max: { odometer: true } }),
      db.maintenanceEntry.aggregate({ where, _max: { odometer: true } }),
    ]);

    const current = [
      readings._max?.odometer ?? null,
      fuel._max?.odometer ?? null,
      maintenance._max?.odometer ?? null,
    ]
      .filter((value): value is Prisma.Decimal => value !== null)
      .reduce<Prisma.Decimal | null>(
        (highest, value) =>
          highest === null || value.gt(highest) ? value : highest,
        null,
      );

    await db.vehicle.update({
      where: { id: vehicleId },
      data: { currentOdometer: current },
    });

    return current;
  }
}
