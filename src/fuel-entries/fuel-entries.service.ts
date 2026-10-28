import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuelEntryDto } from './dto/create-fuel-entry.dto';
import { UpdateFuelEntryDto } from './dto/update-fuel-entry.dto';

@Injectable()
export class FuelEntriesService {
  constructor(private prisma: PrismaService) {}

  create(createFuelEntryDto: CreateFuelEntryDto) {
    const { priceTotal, volume } = createFuelEntryDto;
    const pricePerUnit = priceTotal && volume ? priceTotal / volume : undefined;

    // Calculate efficiency if possible (will need previous odometer)
    return this.prisma.fuelEntry.create({
      data: {
        ...createFuelEntryDto,
        pricePerUnit,
      },
      include: {
        vehicle: true,
      },
    });
  }

  findAll(vehicleId?: string) {
    return this.prisma.fuelEntry.findMany({
      where: vehicleId ? { vehicleId } : {},
      orderBy: { date: 'desc' },
      include: {
        vehicle: true,
      },
    });
  }

  async findOne(id: string) {
    const fuelEntry = await this.prisma.fuelEntry.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    if (!fuelEntry) {
      throw new NotFoundException(`Fuel entry with ID ${id} not found`);
    }

    return fuelEntry;
  }

  async update(id: string, updateFuelEntryDto: UpdateFuelEntryDto) {
    await this.findOne(id);

    const priceTotal = (updateFuelEntryDto as any).priceTotal;
    const volume = (updateFuelEntryDto as any).volume;
    const pricePerUnit =
      priceTotal && volume ? priceTotal / volume : undefined;

    return this.prisma.fuelEntry.update({
      where: { id },
      data: {
        ...updateFuelEntryDto,
        ...(pricePerUnit !== undefined ? { pricePerUnit } : {}),
      } as any,
      include: {
        vehicle: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.fuelEntry.delete({
      where: { id },
    });
  }
}
