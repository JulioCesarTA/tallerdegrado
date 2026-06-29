import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AccessService } from './access.service';
import { CreatePuntoAccesoDto } from './dto/create-punto-acceso.dto';
import { UpdatePuntoAccesoDto } from './dto/update-punto-acceso.dto';

@Controller()
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  // --- PuntoAcceso ---

  @Get('access-points')
  findAccessPoints() {
    return this.accessService.findAccessPoints();
  }

  @Post('access-points')
  createAccessPoint(@Body() dto: CreatePuntoAccesoDto) {
    return this.accessService.createAccessPoint(dto);
  }

  @Patch('access-points/:id')
  updateAccessPoint(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePuntoAccesoDto) {
    return this.accessService.updateAccessPoint(id, dto);
  }

  @Delete('access-points/:id')
  removeAccessPoint(@Param('id', ParseIntPipe) id: number) {
    return this.accessService.removeAccessPoint(id);
  }
}
