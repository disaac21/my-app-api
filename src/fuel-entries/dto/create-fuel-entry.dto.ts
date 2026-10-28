export class CreateFuelEntryDto {
  vehicleId: string;
  date?: Date | string;
  odometer: number;
  odometerUnit?: string;
  tripDistance?: number;
  tripUnit?: string;
  volume: number;
  volumeUnit?: string;
  priceTotal: number;
  currency?: string;
  pricePerUnit?: number;
  station?: string;
  stationName?: string;
  fuelType?: string;
  notes?: string;
  efficiency?: number;
  efficiencyUnit?: string;
}
