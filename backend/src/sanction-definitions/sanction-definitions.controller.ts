import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateSanctionDefinitionDto } from './dto/create-sanction-definition.dto';
import { SanctionDefinitionsService } from './sanction-definitions.service';

@Controller('sanction-definitions')
export class SanctionDefinitionsController {
  constructor(private readonly service: SanctionDefinitionsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateSanctionDefinitionDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
