import { Module } from '@nestjs/common';
import { VehicleReadingsController } from './vehicle-readings.controller';
import { VehicleReadingsService } from './vehicle-readings.service';

@Module({
  controllers: [VehicleReadingsController],
  providers: [VehicleReadingsService],
})
export class VehicleReadingsModule {}
