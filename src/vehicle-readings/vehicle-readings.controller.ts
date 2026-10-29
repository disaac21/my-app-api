import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateVehicleReadingDto,
  QueryVehicleReadingsDto,
  UpdateVehicleReadingDto,
} from './dto/vehicle-reading.dto';
import { VehicleReadingsService } from './vehicle-readings.service';

@Controller('vehicle-readings')
export class VehicleReadingsController {
  constructor(private readonly readings: VehicleReadingsService) {}

  @Get()
  findAll(@Query() query: QueryVehicleReadingsDto) {
    return this.readings.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateVehicleReadingDto) {
    return this.readings.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.readings.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleReadingDto) {
    return this.readings.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.readings.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.readings.restore(id);
  }
}
