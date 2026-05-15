import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { ProcessDetectionDto } from './dto/process-detection.dto';
import { DetectionsService } from './detections.service';

@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Post('ocr-frame')
  @UseInterceptors(FileInterceptor('image', { storage: multer.memoryStorage() }))
  ocrFrame(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.detectionsService.ocrFrame(file);
  }

  @Post('entry')
  @UseInterceptors(FileInterceptor('image', { storage: multer.memoryStorage() }))
  processEntry(
    @Body() dto: ProcessDetectionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.detectionsService.process(dto, file, 'entry');
  }

  @Post('exit')
  @UseInterceptors(FileInterceptor('image', { storage: multer.memoryStorage() }))
  processExit(
    @Body() dto: ProcessDetectionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.detectionsService.process(dto, file, 'exit');
  }
}
