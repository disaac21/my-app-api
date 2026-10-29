import { PartialType } from '@nestjs/mapped-types';
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

export class CreateVehicleDocumentDto {
  /** Code from params.DOCUMENT_GROUP: PERSONAL | VEHICLE. */
  @IsString()
  @IsNotEmpty()
  group: string;

  /** Code from params.DOCUMENT_TYPE: DRIVER_LICENSE | INSURANCE | REGISTRATION. */
  @IsString()
  @IsNotEmpty()
  type: string;

  /** Required for VEHICLE documents, must be absent for PERSONAL ones. */
  @IsOptional()
  @IsString()
  vehicleId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  number?: string;

  /** Insurer or issuing authority. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  provider?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  issuedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  expiresAt?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999.99)
  cost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateVehicleDocumentDto extends PartialType(
  CreateVehicleDocumentDto,
) {}

export class QueryVehicleDocumentsDto extends ArchiveFilterQueryDto {
  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  /** Documents expiring on or before this date. */
  @IsOptional()
  @Type(() => Date)
  @IsDateValue()
  expiringBefore?: Date;
}
