import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { CamerasModule } from '../cameras/cameras.module';
import { StorageModule } from '../storage/storage.module';
import { VisionModule } from '../vision/vision.module';
import { DetectionsController } from './detections.controller';
import { DetectionsService } from './detections.service';

@Module({
  imports: [StorageModule, CamerasModule, AlertsModule, VisionModule],
  controllers: [DetectionsController],
  providers: [DetectionsService],
})
export class DetectionsModule {}
