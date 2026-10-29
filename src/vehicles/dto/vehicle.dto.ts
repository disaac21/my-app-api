import { PartialType } from '@nestjs/mapped-types';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ToBoolean } from '../../common/transforms/to-boolean';
import { normalizePlate } from '../../common/utils/strings';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1886)
  @Max(2100)
  year: number;

  /** Required and unique: with VIN gone, this is the vehicle's identity. */
  @Transform(({ value }: TransformFnParams) => {
    const raw: unknown = value;
    return typeof raw === 'string' ? normalizePlate(raw) : raw;
  })
  @IsString()
  @Length(1, 16)
  plate: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  trim?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  nickname?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'colorHex must be a hex colour such as #1F2937',
  })
  colorHex?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  engine?: string;

  /** Code from params.FUEL_TYPE. */
  @IsOptional()
  @IsString()
  fuelType?: string;

  /** Code from params.TRANSMISSION_TYPE. */
  @IsOptional()
  @IsString()
  transmission?: string;

  /** Code from params.DRIVE_TYPE. */
  @IsOptional()
  @IsString()
  driveType?: string;

  /** Litres. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(99999.9)
  tankCapacity?: number;

  /** kPa. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2000)
  tirePressureFront?: number;

  /** kPa. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2000)
  tirePressureRear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  oilType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  oilSpecification?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(999.9)
  batteryVoltage?: number;
}

/**
 * `currentOdometer` and `isActive` are deliberately absent: the first is
 * derived from readings/fuel/maintenance, the second is only changed by
 * DELETE (archive) and POST /:id/restore.
 */
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}

export class QueryVehiclesDto extends PaginationQueryDto {
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive: boolean = true;

  @IsOptional()
  @IsString()
  makeId?: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  /** Matches plate, nickname, model name or make name. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;
}
