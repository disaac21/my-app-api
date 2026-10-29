import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsDateValue } from '../../common/validators/is-date-value';
import { ToBoolean } from '../../common/transforms/to-boolean';

export class CreateMaintenancePlanDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  /** Code from params.MAINTENANCE_TYPE. */
  @IsString()
  @IsNotEmpty()
  type: string;

  /** km. At least one of intervalDistance / intervalMonths is required. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  intervalDistance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  intervalMonths?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  lastDoneAt?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(9999999.9)
  lastDoneOdometer?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateMaintenancePlanDto extends PartialType(
  OmitType(CreateMaintenancePlanDto, ['vehicleId'] as const),
) {}

export class QueryMaintenancePlansDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  /** Plans whose time-based due date has passed. */
  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  dueBefore?: Date;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive: boolean = true;
}

export class CompleteMaintenancePlanDto {
  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  performedAt?: Date;

  /** Defaults to the vehicle's current odometer. */
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

  /** Also write a MaintenanceEntry for this job. Defaults to true. */
  @IsOptional()
  @IsBoolean()
  createEntry?: boolean;
}
