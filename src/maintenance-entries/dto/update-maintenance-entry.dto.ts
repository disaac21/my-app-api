import { PartialType } from '@nestjs/mapped-types';
import { CreateMaintenanceEntryDto } from './create-maintenance-entry.dto';

export class UpdateMaintenanceEntryDto extends PartialType(CreateMaintenanceEntryDto) {}
