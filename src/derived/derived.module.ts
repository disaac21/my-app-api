import { Global, Module } from '@nestjs/common';
import { FuelChainService } from './fuel-chain.service';
import { MaintenanceDueService } from './maintenance-due.service';
import { OdometerService } from './odometer.service';
import { VehicleGuardService } from './vehicle-guard.service';

/**
 * Global so every resource service can ask for a recompute without importing
 * this module in ten places. It has no controllers.
 */
@Global()
@Module({
  providers: [
    FuelChainService,
    MaintenanceDueService,
    OdometerService,
    VehicleGuardService,
  ],
  exports: [
    FuelChainService,
    MaintenanceDueService,
    OdometerService,
    VehicleGuardService,
  ],
})
export class DerivedModule {}
