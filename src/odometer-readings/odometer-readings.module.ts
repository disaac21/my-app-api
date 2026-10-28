import { Module } from '@nestjs/common';
import { OdometerReadingsService } from './odometer-readings.service';
import { OdometerReadingsController } from './odometer-readings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OdometerReadingsController],
  providers: [OdometerReadingsService],
  exports: [OdometerReadingsService],
})
export class OdometerReadingsModule {}
