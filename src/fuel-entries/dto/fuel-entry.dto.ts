import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
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

export class CreateFuelEntryDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  filledAt?: Date;

  /** km. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(9999999.9)
  odometer: number;

  /** Litres. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(99999.999)
  volume: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999.99)
  priceTotal: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  station?: string;

  /** Code from params.FUEL_TYPE. */
  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsBoolean()
  isFullTank?: boolean;

  @IsOptional()
  @IsBoolean()
  missedPreviousEntry?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/**
 * `pricePerUnit`, `tripDistance` and `efficiency` are derived and therefore
 * absent here — the service computes them.
 */
export class UpdateFuelEntryDto extends PartialType(
  OmitType(CreateFuelEntryDto, ['vehicleId'] as const),
) {}

export class QueryFuelEntriesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  to?: Date;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive: boolean = true;
}
