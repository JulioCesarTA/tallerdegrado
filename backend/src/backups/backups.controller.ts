import { Controller, Post } from '@nestjs/common';
import { BackupsService } from './backups.service';

@Controller('backups')
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Post('generate')
  generate() {
    return this.backupsService.generate();
  }
}
