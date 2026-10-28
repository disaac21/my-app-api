export class CreateQuickUpdateDto {
  vehicleId: string;
  odometer?: number;
  odometerUnit?: string;
  fuelLevel?: number;
  fuelLevelUnit?: string;
  date?: Date | string;
  notes?: string;
}
