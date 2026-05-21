import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsGateway } from './reports.gateway';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsGateway],
  exports: [ReportsGateway],
})
export class ReportsModule {}
