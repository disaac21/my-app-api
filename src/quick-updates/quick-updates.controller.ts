import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { QuickUpdatesService } from './quick-updates.service';
import { CreateQuickUpdateDto } from './dto/create-quick-update.dto';
import { UpdateQuickUpdateDto } from './dto/update-quick-update.dto';

@Controller('quick-updates')
export class QuickUpdatesController {
  constructor(private readonly quickUpdatesService: QuickUpdatesService) {}

  @Post()
  create(@Body() createQuickUpdateDto: CreateQuickUpdateDto) {
    return this.quickUpdatesService.create(createQuickUpdateDto);
  }

  @Get()
  findAll(@Query('vehicleId') vehicleId?: string) {
    return this.quickUpdatesService.findAll(vehicleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quickUpdatesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuickUpdateDto: UpdateQuickUpdateDto) {
    return this.quickUpdatesService.update(id, updateQuickUpdateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quickUpdatesService.remove(id);
  }
}
