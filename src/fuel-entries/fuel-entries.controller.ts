import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FuelEntriesService } from './fuel-entries.service';
import { CreateFuelEntryDto } from './dto/create-fuel-entry.dto';
import { UpdateFuelEntryDto } from './dto/update-fuel-entry.dto';

@Controller('fuel-entries')
export class FuelEntriesController {
  constructor(private readonly fuelEntriesService: FuelEntriesService) {}

  @Post()
  create(@Body() createFuelEntryDto: CreateFuelEntryDto) {
    return this.fuelEntriesService.create(createFuelEntryDto);
  }

  @Get()
  findAll(@Query('vehicleId') vehicleId?: string) {
    return this.fuelEntriesService.findAll(vehicleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fuelEntriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFuelEntryDto: UpdateFuelEntryDto) {
    return this.fuelEntriesService.update(id, updateFuelEntryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fuelEntriesService.remove(id);
  }
}
