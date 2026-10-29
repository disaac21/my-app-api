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
  CreateMaintenanceEntryDto,
  QueryMaintenanceEntriesDto,
  UpdateMaintenanceEntryDto,
} from './dto/maintenance-entry.dto';
import { MaintenanceEntriesService } from './maintenance-entries.service';

@Controller('maintenance-entries')
export class MaintenanceEntriesController {
  constructor(private readonly entries: MaintenanceEntriesService) {}

  @Get()
  findAll(@Query() query: QueryMaintenanceEntriesDto) {
    return this.entries.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateMaintenanceEntryDto) {
    return this.entries.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.entries.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceEntryDto) {
    return this.entries.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.entries.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.entries.restore(id);
  }
}
