import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateParqueoDto } from './dto/create-parqueo.dto';
import { UpdateParqueoDto } from './dto/update-parqueo.dto';
import { ParqueoService } from './parqueo.service';

@Controller('parqueos')
export class ParqueoController {
  constructor(private readonly parqueoService: ParqueoService) {}

  @Get()
  findAll() {
    return this.parqueoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parqueoService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateParqueoDto) {
    return this.parqueoService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateParqueoDto) {
    return this.parqueoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.parqueoService.remove(id);
  }
}
