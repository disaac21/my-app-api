import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogueModule } from './catalogue/catalogue.module';
import { DerivedModule } from './derived/derived.module';
import { FuelEntriesModule } from './fuel-entries/fuel-entries.module';
import { HealthModule } from './health/health.module';
import { MaintenanceEntriesModule } from './maintenance-entries/maintenance-entries.module';
import { MaintenancePlansModule } from './maintenance-plans/maintenance-plans.module';
import { MakesModule } from './makes/makes.module';
import { ModelsModule } from './models/models.module';
import { ParamsModule } from './params/params.module';
import { PrismaModule } from './prisma/prisma.module';
import { VehicleDocumentsModule } from './vehicle-documents/vehicle-documents.module';
import { VehicleReadingsModule } from './vehicle-readings/vehicle-readings.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    PrismaModule,
    DerivedModule,
    ParamsModule,
    HealthModule,
    CatalogueModule,
    MakesModule,
    ModelsModule,
    VehiclesModule,
    VehicleReadingsModule,
    FuelEntriesModule,
    MaintenanceEntriesModule,
    MaintenancePlansModule,
    VehicleDocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
