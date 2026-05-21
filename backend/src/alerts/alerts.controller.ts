import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AlertsService } from './alerts.service';

class UpdateStatusDto {
  @IsString()
  estado: string;
}

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll() {
    return this.alertsService.findAll();
  }

  @Patch(':id')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.alertsService.updateStatus(id, dto.estado);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.alertsService.remove(id);
  }
}
