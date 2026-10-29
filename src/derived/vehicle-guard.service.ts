import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Records (readings, fuel, maintenance, documents) may only be attached to a
 * live vehicle. Archiving a vehicle hides it from lists but keeps its history;
 * adding new history to an archived vehicle is almost always a UI bug.
 */
@Injectable()
export class VehicleGuardService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureActive(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, isActive: true, currentOdometer: true },
    });

    if (!vehicle)
      throw new NotFoundException(`Vehicle "${id}" does not exist.`);

    if (!vehicle.isActive) {
      throw new ConflictException(
        `Vehicle "${id}" is archived. Restore it with POST /vehicles/${id}/restore before adding records.`,
      );
    }

    return vehicle;
  }
}
