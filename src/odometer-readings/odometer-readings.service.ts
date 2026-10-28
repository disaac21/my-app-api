import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOdometerReadingDto } from './dto/create-odometer-reading.dto';
import { UpdateOdometerReadingDto } from './dto/update-odometer-reading.dto';

@Injectable()
export class OdometerReadingsService {
  constructor(private prisma: PrismaService) {}

  async create(createOdometerReadingDto: CreateOdometerReadingDto) {
    const reading = await this.prisma.odometerReading.create({
      data: createOdometerReadingDto,
      include: {
        vehicle: true,
      },
    });

    // Update vehicle's current odometer
    if (reading.vehicleId && reading.odometer) {
      await this.prisma.vehicle.update({
        where: { id: reading.vehicleId },
        data: { currentOdometer: reading.odometer },
      });
    }

    return reading;
  }

  findAll(vehicleId?: string) {
    return this.prisma.odometerReading.findMany({
      where: vehicleId ? { vehicleId } : {},
      orderBy: { date: 'desc' },
      include: {
        vehicle: true,
      },
    });
  }

  async findOne(id: string) {
    const odometerReading = await this.prisma.odometerReading.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    if (!odometerReading) {
      throw new NotFoundException(`Odometer reading with ID ${id} not found`);
    }

    return odometerReading;
  }

  async update(id: string, updateOdometerReadingDto: UpdateOdometerReadingDto) {
    await this.findOne(id);

    return this.prisma.odometerReading.update({
      where: { id },
      data: updateOdometerReadingDto,
      include: {
        vehicle: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.odometerReading.delete({
      where: { id },
    });
  }
}
