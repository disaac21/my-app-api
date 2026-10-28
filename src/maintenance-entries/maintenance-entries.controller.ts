import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MaintenanceEntriesService } from './maintenance-entries.service';
import { CreateMaintenanceEntryDto } from './dto/create-maintenance-entry.dto';
import { UpdateMaintenanceEntryDto } from './dto/update-maintenance-entry.dto';

@Controller('maintenance-entries')
export class MaintenanceEntriesController {
  constructor(private readonly maintenanceEntriesService: MaintenanceEntriesService) {}

  @Post()
  create(@Body() createMaintenanceEntryDto: CreateMaintenanceEntryDto) {
    return this.maintenanceEntriesService.create(createMaintenanceEntryDto);
  }

  @Get()
  findAll(@Query('vehicleId') vehicleId?: string, @Query('type') type?: string) {
    return this.maintenanceEntriesService.findAll(vehicleId, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceEntriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMaintenanceEntryDto: UpdateMaintenanceEntryDto) {
    return this.maintenanceEntriesService.update(id, updateMaintenanceEntryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maintenanceEntriesService.remove(id);
  }
}
