import { Module } from '@nestjs/common';
import { FuelEntriesService } from './fuel-entries.service';
import { FuelEntriesController } from './fuel-entries.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FuelEntriesController],
  providers: [FuelEntriesService],
  exports: [FuelEntriesService],
})
export class FuelEntriesModule {}
