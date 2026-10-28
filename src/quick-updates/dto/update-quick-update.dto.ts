import { PartialType } from '@nestjs/mapped-types';
import { CreateQuickUpdateDto } from './create-quick-update.dto';

export class UpdateQuickUpdateDto extends PartialType(CreateQuickUpdateDto) {}
