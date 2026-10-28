export class CreateOdometerReadingDto {
  vehicleId: string;
  odometer: number;
  odometerUnit?: string;
  date?: Date | string;
  notes?: string;
  source?: string;
}
