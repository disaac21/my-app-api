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
  CompleteMaintenancePlanDto,
  CreateMaintenancePlanDto,
  QueryMaintenancePlansDto,
  UpdateMaintenancePlanDto,
} from './dto/maintenance-plan.dto';
import { MaintenancePlansService } from './maintenance-plans.service';

@Controller('maintenance-plans')
export class MaintenancePlansController {
  constructor(private readonly plans: MaintenancePlansService) {}

  @Get()
  findAll(@Query() query: QueryMaintenancePlansDto) {
    return this.plans.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateMaintenancePlanDto) {
    return this.plans.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plans.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaintenancePlanDto) {
    return this.plans.update(id, dto);
  }

  /** Mark the job done: moves the anchor, recomputes due dates, logs an entry. */
  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteMaintenancePlanDto) {
    return this.plans.complete(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plans.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.plans.restore(id);
  }
}
