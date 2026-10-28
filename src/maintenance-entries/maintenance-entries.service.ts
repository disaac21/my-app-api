import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceEntryDto } from './dto/create-maintenance-entry.dto';
import { UpdateMaintenanceEntryDto } from './dto/update-maintenance-entry.dto';

@Injectable()
export class MaintenanceEntriesService {
  constructor(private prisma: PrismaService) {}

  create(createMaintenanceEntryDto: CreateMaintenanceEntryDto) {
    const { parts, ...maintenanceData } = createMaintenanceEntryDto as any;

    return this.prisma.maintenanceEntry.create({
      data: {
        ...maintenanceData,
        ...(parts && parts.length > 0
          ? {
              parts: {
                create: parts,
              },
            }
          : {}),
      },
      include: {
        vehicle: true,
        parts: true,
      },
    });
  }

  findAll(vehicleId?: string, type?: string) {
    return this.prisma.maintenanceEntry.findMany({
      where: {
        ...(vehicleId ? { vehicleId } : {}),
        ...(type ? { type: type as any } : {}),
      },
      orderBy: { date: 'desc' },
      include: {
        vehicle: true,
        parts: true,
      },
    });
  }

  async findOne(id: string) {
    const maintenanceEntry = await this.prisma.maintenanceEntry.findUnique({
      where: { id },
      include: {
        vehicle: true,
        parts: true,
      },
    });

    if (!maintenanceEntry) {
      throw new NotFoundException(`Maintenance entry with ID ${id} not found`);
    }

    return maintenanceEntry;
  }

  async update(id: string, updateMaintenanceEntryDto: UpdateMaintenanceEntryDto) {
    await this.findOne(id);

    const { parts, ...maintenanceData } = updateMaintenanceEntryDto as any;

    return this.prisma.maintenanceEntry.update({
      where: { id },
      data: maintenanceData,
      include: {
        vehicle: true,
        parts: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.maintenanceEntry.delete({
      where: { id },
    });
  }
}
