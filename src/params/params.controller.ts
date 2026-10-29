import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common';
import { ParamsService } from './params.service';
import { PatchParamDto, ReplaceParamDto } from './dto/param.dto';

@Controller('params')
export class ParamsController {
  constructor(private readonly paramsService: ParamsService) {}

  /** Everything the frontend needs to build its forms, grouped by kind. */
  @Get()
  findAll() {
    return this.paramsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.paramsService.findOne(key);
  }

  /** Replace an entire option array. Order is display order, first is default. */
  @Put(':key')
  replace(@Param('key') key: string, @Body() dto: ReplaceParamDto) {
    return this.paramsService.replace(key, dto);
  }

  /** Append, relabel or remove individual options without rewriting the array. */
  @Patch(':key')
  patch(@Param('key') key: string, @Body() dto: PatchParamDto) {
    return this.paramsService.patch(key, dto);
  }
}
