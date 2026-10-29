import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const CODE_PATTERN = /^[A-Z0-9_]+$/;

export class ParamOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(CODE_PATTERN, {
    message: 'key must be an uppercase code such as DIESEL or GALLON_US',
  })
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  symbol?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  groups?: string[];
}

export class ParamOptionUpdateDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  symbol?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  groups?: string[];
}

/** PUT — replace the whole array. Order is display order, first is default. */
export class ReplaceParamDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParamOptionDto)
  options: ParamOptionDto[];
}

/**
 * PATCH — merge into the existing array. All three fields are optional and are
 * applied in the order remove -> update -> append.
 */
export class PatchParamDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParamOptionDto)
  append?: ParamOptionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParamOptionUpdateDto)
  update?: ParamOptionUpdateDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}
