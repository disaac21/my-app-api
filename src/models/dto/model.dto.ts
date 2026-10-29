import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateModelDto {
  @IsString()
  @IsNotEmpty()
  makeId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;
}

export class UpdateModelDto extends PartialType(CreateModelDto) {}

export class QueryModelsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  makeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;
}
