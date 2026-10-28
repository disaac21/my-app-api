import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  create(createVehicleDto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: createVehicleDto,
    });
  }

  findAll() {
    return this.prisma.vehicle.findMany({
      where: { isActive: true },
      include: {
        fuelEntries: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        maintenanceEntries: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        odometerReadings: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        fuelEntries: {
          orderBy: { date: 'desc' },
        },
        maintenanceEntries: {
          orderBy: { date: 'desc' },
          include: {
            parts: true,
          },
        },
        odometerReadings: {
          orderBy: { date: 'desc' },
        },
        quickUpdates: {
          orderBy: { date: 'desc' },
        },
        owner: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async findByPlate(plate: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with plate ${plate} not found`);
    }

    return vehicle;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    await this.findOne(id);

    return this.prisma.vehicle.update({
      where: { id },
      data: updateVehicleDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.vehicle.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getVehicleStats(id: string) {
    await this.findOne(id);

    const [fuelCount, maintenanceCount, totalFuelCost, totalMaintenanceCost, latestOdometer] = await Promise.all([
      this.prisma.fuelEntry.count({ where: { vehicleId: id } }),
      this.prisma.maintenanceEntry.count({ where: { vehicleId: id } }),
      this.prisma.fuelEntry.aggregate({
        where: { vehicleId: id },
        _sum: { priceTotal: true },
      }),
      this.prisma.maintenanceEntry.aggregate({
        where: { vehicleId: id },
        _sum: { cost: true },
      }),
      this.prisma.odometerReading.findFirst({
        where: { vehicleId: id },
        orderBy: { date: 'desc' },
      }),
    ]);

    return {
      fuelCount,
      maintenanceCount,
      totalFuelCost: totalFuelCost._sum.priceTotal || 0,
      totalMaintenanceCost: totalMaintenanceCost._sum.cost || 0,
      latestOdometer: latestOdometer?.odometer || 0,
      latestOdometerDate: latestOdometer?.date,
    };
  }
}
