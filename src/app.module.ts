import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { FuelEntriesModule } from './fuel-entries/fuel-entries.module';
import { MaintenanceEntriesModule } from './maintenance-entries/maintenance-entries.module';
import { OdometerReadingsModule } from './odometer-readings/odometer-readings.module';
import { QuickUpdatesModule } from './quick-updates/quick-updates.module';

@Module({
  imports: [
    PrismaModule,
    VehiclesModule,
    FuelEntriesModule,
    MaintenanceEntriesModule,
    OdometerReadingsModule,
    QuickUpdatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
