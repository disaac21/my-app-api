import { IsBoolean, IsOptional } from 'class-validator';
import { ToBoolean } from '../transforms/to-boolean';
import { PaginationQueryDto } from './pagination-query.dto';

/**
 * Every resource is archived rather than deleted, so every list endpoint takes
 * the same filter. `isActive` defaults to true; pass `?isActive=false` to list
 * the archive.
 *
 * Archived *vehicles* are a separate axis. Their history stays in the database,
 * but a record belonging to an archived vehicle is hidden from the default
 * lists just as the vehicle itself is — otherwise the archive would only be
 * half enforced. `?includeArchivedVehicles=true` brings those rows back.
 */
export class ArchiveFilterQueryDto extends PaginationQueryDto {
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive: boolean = true;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includeArchivedVehicles: boolean = false;
}
