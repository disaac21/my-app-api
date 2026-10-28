import { Module } from '@nestjs/common';
import { QuickUpdatesService } from './quick-updates.service';
import { QuickUpdatesController } from './quick-updates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuickUpdatesController],
  providers: [QuickUpdatesService],
  exports: [QuickUpdatesService],
})
export class QuickUpdatesModule {}
