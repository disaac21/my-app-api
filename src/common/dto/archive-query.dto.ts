import { IsBoolean, IsOptional } from 'class-validator';
import { ToBoolean } from '../transforms/to-boolean';
import { PaginationQueryDto } from './pagination-query.dto';

/**
 * Every resource is archived rather than deleted, so every list endpoint takes
 * the same filter. `isActive` defaults to true; pass `?isActive=false` to list
 * the archive.
 */
export class ArchiveFilterQueryDto extends PaginationQueryDto {
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive: boolean = true;
}
