import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateSanctionDto } from './dto/create-sanction.dto';
import { SanctionsService } from './sanctions.service';

@Controller('sanctions')
export class SanctionsController {
  constructor(private readonly sanctionsService: SanctionsService) {}

  @Get()
  findAll() {
    return this.sanctionsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateSanctionDto) {
    return this.sanctionsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sanctionsService.remove(id);
  }
}
