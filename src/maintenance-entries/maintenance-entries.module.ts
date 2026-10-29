import { Module } from '@nestjs/common';
import { MaintenancePlansModule } from '../maintenance-plans/maintenance-plans.module';
import { MaintenanceEntriesController } from './maintenance-entries.controller';
import { MaintenanceEntriesService } from './maintenance-entries.service';

@Module({
  imports: [MaintenancePlansModule],
  controllers: [MaintenanceEntriesController],
  providers: [MaintenanceEntriesService],
})
export class MaintenanceEntriesModule {}
