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
import { parseFlag } from '../common/utils/flags';
import {
  CreateVehicleDto,
  QueryVehiclesDto,
  UpdateVehicleDto,
} from './dto/vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(@Query() query: QueryVehiclesDto) {
    return this.vehiclesService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.vehiclesService.findOne(id, parseFlag(includeArchived));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  /** Archive: sets isActive = false and archives the vehicle's documents. */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.vehiclesService.restore(id);
  }
}
