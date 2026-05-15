import { Module } from '@nestjs/common';
import { StreamingGateway } from './streaming.gateway';

@Module({
  providers: [StreamingGateway],
})
export class StreamingModule {}
