import { Module } from '@nestjs/common';
import { MaintenanceEntriesController } from './maintenance-entries.controller';
import { MaintenanceEntriesService } from './maintenance-entries.service';

@Module({
  controllers: [MaintenanceEntriesController],
  providers: [MaintenanceEntriesService],
})
export class MaintenanceEntriesModule {}
