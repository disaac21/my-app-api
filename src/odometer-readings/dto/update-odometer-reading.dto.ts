import { PartialType } from '@nestjs/mapped-types';
import { CreateOdometerReadingDto } from './create-odometer-reading.dto';

export class UpdateOdometerReadingDto extends PartialType(CreateOdometerReadingDto) {}
