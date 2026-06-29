import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreatePlazaDto } from './dto/create-plaza.dto';
import { UpdatePlazaDto } from './dto/update-plaza.dto';
import { PlazaService } from './plaza.service';

@Controller('plazas')
export class PlazaController {
  constructor(private readonly plazaService: PlazaService) {}

  @Get()
  findAll() {
    return this.plazaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plazaService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePlazaDto) {
    return this.plazaService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlazaDto) {
    return this.plazaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.plazaService.remove(id);
  }
}
