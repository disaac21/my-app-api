import { PartialType } from '@nestjs/mapped-types';
import { CreateFuelEntryDto } from './create-fuel-entry.dto';

export class UpdateFuelEntryDto extends PartialType(CreateFuelEntryDto) {}
