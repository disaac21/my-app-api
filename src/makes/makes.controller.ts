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
import { CreateMakeDto, QueryMakesDto, UpdateMakeDto } from './dto/make.dto';
import { MakesService } from './makes.service';

@Controller('makes')
export class MakesController {
  constructor(private readonly makesService: MakesService) {}

  @Get()
  findAll(@Query() query: QueryMakesDto) {
    return this.makesService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateMakeDto) {
    return this.makesService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.makesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMakeDto) {
    return this.makesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.makesService.remove(id);
  }
}
