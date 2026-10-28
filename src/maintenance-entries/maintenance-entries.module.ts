import { Module } from '@nestjs/common';
import { MaintenanceEntriesService } from './maintenance-entries.service';
import { MaintenanceEntriesController } from './maintenance-entries.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MaintenanceEntriesController],
  providers: [MaintenanceEntriesService],
  exports: [MaintenanceEntriesService],
})
export class MaintenanceEntriesModule {}
