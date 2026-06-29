import { Module } from '@nestjs/common';
import { ParqueoController } from './parqueo.controller';
import { ParqueoService } from './parqueo.service';

@Module({
  controllers: [ParqueoController],
  providers: [ParqueoService],
})
export class ParqueoModule {}
