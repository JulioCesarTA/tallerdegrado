import { Module } from '@nestjs/common';
import { BiService } from './bi.service';

@Module({
  providers: [BiService],
})
export class BiModule {}
