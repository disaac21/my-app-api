import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OdometerReadingsService } from './odometer-readings.service';
import { CreateOdometerReadingDto } from './dto/create-odometer-reading.dto';
import { UpdateOdometerReadingDto } from './dto/update-odometer-reading.dto';

@Controller('odometer-readings')
export class OdometerReadingsController {
  constructor(private readonly odometerReadingsService: OdometerReadingsService) {}

  @Post()
  create(@Body() createOdometerReadingDto: CreateOdometerReadingDto) {
    return this.odometerReadingsService.create(createOdometerReadingDto);
  }

  @Get()
  findAll(@Query('vehicleId') vehicleId?: string) {
    return this.odometerReadingsService.findAll(vehicleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.odometerReadingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOdometerReadingDto: UpdateOdometerReadingDto) {
    return this.odometerReadingsService.update(id, updateOdometerReadingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.odometerReadingsService.remove(id);
  }
}
