import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { StreamingGateway } from './streaming.gateway';

@Module({
  imports: [AlertsModule],
  providers: [StreamingGateway],
})
export class StreamingModule {}
