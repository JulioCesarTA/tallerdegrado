import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CamerasService } from './cameras.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';

@Controller('cameras')
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  @Get()
  findAll() {
    return this.camerasService.findAll();
  }

  @Get('types')
  findTypes() {
    return this.camerasService.findTypes();
  }

  @Get('statuses')
  findStatuses() {
    return this.camerasService.findStatuses();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.camerasService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCameraDto) {
    return this.camerasService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCameraDto) {
    return this.camerasService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.camerasService.remove(id);
  }
}
