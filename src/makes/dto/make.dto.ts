import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateMakeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;
}

/** Must be a class, not `Partial<CreateMakeDto>`: type aliases carry no metadata. */
export class UpdateMakeDto extends PartialType(CreateMakeDto) {}

export class QueryMakesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;
}
