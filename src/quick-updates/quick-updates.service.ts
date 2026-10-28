import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuickUpdateDto } from './dto/create-quick-update.dto';
import { UpdateQuickUpdateDto } from './dto/update-quick-update.dto';

@Injectable()
export class QuickUpdatesService {
  constructor(private prisma: PrismaService) {}

  async create(createQuickUpdateDto: CreateQuickUpdateDto) {
    const quickUpdate = await this.prisma.quickUpdate.create({
      data: createQuickUpdateDto,
      include: {
        vehicle: true,
      },
    });

    // Update vehicle's current odometer if provided
    if (quickUpdate.vehicleId && quickUpdate.odometer) {
      await this.prisma.vehicle.update({
        where: { id: quickUpdate.vehicleId },
        data: { currentOdometer: quickUpdate.odometer },
      });
    }

    return quickUpdate;
  }

  findAll(vehicleId?: string) {
    return this.prisma.quickUpdate.findMany({
      where: vehicleId ? { vehicleId } : {},
      orderBy: { date: 'desc' },
      include: {
        vehicle: true,
      },
    });
  }

  async findOne(id: string) {
    const quickUpdate = await this.prisma.quickUpdate.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    if (!quickUpdate) {
      throw new NotFoundException(`Quick update with ID ${id} not found`);
    }

    return quickUpdate;
  }

  async update(id: string, updateQuickUpdateDto: UpdateQuickUpdateDto) {
    await this.findOne(id);

    return this.prisma.quickUpdate.update({
      where: { id },
      data: updateQuickUpdateDto,
      include: {
        vehicle: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.quickUpdate.delete({
      where: { id },
    });
  }
}
