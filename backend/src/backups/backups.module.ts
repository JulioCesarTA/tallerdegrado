import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { BackupsController } from './backups.controller';
import { BackupsService } from './backups.service';

@Module({
  imports: [StorageModule],
  controllers: [BackupsController],
  providers: [BackupsService],
})
export class BackupsModule {}
