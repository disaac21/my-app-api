import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateVehicleDocumentDto,
  QueryVehicleDocumentsDto,
  UpdateVehicleDocumentDto,
} from './dto/vehicle-document.dto';
import { VehicleDocumentsService } from './vehicle-documents.service';

@Controller('vehicle-documents')
export class VehicleDocumentsController {
  constructor(private readonly documents: VehicleDocumentsService) {}

  @Get()
  findAll(@Query() query: QueryVehicleDocumentsDto) {
    return this.documents.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateVehicleDocumentDto) {
    return this.documents.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documents.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDocumentDto) {
    return this.documents.update(id, dto);
  }

  /** Archive — documents are never hard-deleted. */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documents.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.documents.restore(id);
  }
}
