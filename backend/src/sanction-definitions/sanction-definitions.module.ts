import { Module } from '@nestjs/common';
import { SanctionDefinitionsController } from './sanction-definitions.controller';
import { SanctionDefinitionsService } from './sanction-definitions.service';

@Module({
  controllers: [SanctionDefinitionsController],
  providers: [SanctionDefinitionsService],
})
export class SanctionDefinitionsModule {}
