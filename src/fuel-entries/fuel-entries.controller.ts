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
  CreateFuelEntryDto,
  QueryFuelEntriesDto,
  UpdateFuelEntryDto,
} from './dto/fuel-entry.dto';
import { FuelEntriesService } from './fuel-entries.service';

@Controller('fuel-entries')
export class FuelEntriesController {
  constructor(private readonly fuelEntries: FuelEntriesService) {}

  @Get()
  findAll(@Query() query: QueryFuelEntriesDto) {
    return this.fuelEntries.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateFuelEntryDto) {
    return this.fuelEntries.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fuelEntries.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFuelEntryDto) {
    return this.fuelEntries.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fuelEntries.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.fuelEntries.restore(id);
  }
}
