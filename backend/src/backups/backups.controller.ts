import { Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BackupsService } from './backups.service';

@Controller('backups')
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Post('generate')
  generate(@Req() req: Request) {
    const user = req.user as { sub: number };
    return this.backupsService.generate(user.sub);
  }
}
