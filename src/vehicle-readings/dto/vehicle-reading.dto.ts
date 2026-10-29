import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsInt,
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

export class CreateVehicleReadingDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(9999999.9)
  odometer?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  fuelLevelPct?: number;

  /** Code from params.READING_SOURCE. Defaults to MANUAL. */
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  recordedAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/** A reading never moves to another vehicle. */
export class UpdateVehicleReadingDto extends PartialType(
  OmitType(CreateVehicleReadingDto, ['vehicleId'] as const),
) {}

export class QueryVehicleReadingsDto extends ArchiveFilterQueryDto {
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
}
