import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ArchiveFilterQueryDto } from '../../common/dto/archive-query.dto';
import { IsDateValue } from '../../common/validators/is-date-value';

export class CreateMaintenanceEntryDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  /** Code from params.MAINTENANCE_TYPE. */
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  performedAt?: Date;

  /** km. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(9999999.9)
  odometer?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999.99)
  cost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shop?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateMaintenanceEntryDto extends PartialType(
  OmitType(CreateMaintenanceEntryDto, ['vehicleId'] as const),
) {}

export class QueryMaintenanceEntriesDto extends ArchiveFilterQueryDto {
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  to?: Date;
}
