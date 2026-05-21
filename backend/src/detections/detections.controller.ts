import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { DetectionsService } from './detections.service';
import { RegisterEntryDto } from './dto/register-entry.dto';
import { RegisterExitDto } from './dto/register-exit.dto';

const memStorage = { storage: multer.memoryStorage() };

@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Post('ocr-frame')
  @UseInterceptors(FileInterceptor('image', memStorage))
  ocrFrame(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.detectionsService.ocrFrame(file);
  }

  @Post('analyze-vehicle')
  @UseInterceptors(FileInterceptor('image', memStorage))
  analyzeVehicle(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.detectionsService.analyzeVehicleFile(file);
  }

  @Post('entry')
  @UseInterceptors(FileInterceptor('image', memStorage))
  registerEntry(
    @Body() dto: RegisterEntryDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.detectionsService.registerEntry(dto, file);
  }

  @Post('exit')
  @UseInterceptors(FileInterceptor('image', memStorage))
  registerExit(
    @Body() dto: RegisterExitDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.detectionsService.registerExit(dto, file);
  }
}
