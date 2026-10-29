import { Global, Module } from '@nestjs/common';
import { ParamsController } from './params.controller';
import { ParamsService } from './params.service';

/**
 * Global: every write path validates param codes, so this is imported by use,
 * not by declaration.
 */
@Global()
@Module({
  controllers: [ParamsController],
  providers: [ParamsService],
  exports: [ParamsService],
})
export class ParamsModule {}
