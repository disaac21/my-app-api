import { MaintenanceType } from '@prisma/client';

export class MaintenancePartDto {
  name: string;
  partNumber?: string;
  quantity?: number;
  cost?: number;
  currency?: string;
  notes?: string;
}

export class CreateMaintenanceEntryDto {
  vehicleId: string;
  type: MaintenanceType;
  title?: string;
  description?: string;
  odometer?: number;
  odometerUnit?: string;
  cost?: number;
  currency?: string;
  shop?: string;
  provider?: string;
  date?: Date | string;
  dueDate?: Date | string;
  completed?: boolean;
  completedAt?: Date | string;
  notes?: string;
  parts?: MaintenancePartDto[];
}
