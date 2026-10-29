import { Module } from '@nestjs/common';
import { MakesController } from './makes.controller';
import { MakesService } from './makes.service';

@Module({
  controllers: [MakesController],
  providers: [MakesService],
})
export class MakesModule {}
