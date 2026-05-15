import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSanctionDefinitionDto } from './dto/create-sanction-definition.dto';

@Injectable()
export class SanctionDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.sanctionDefinition.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateSanctionDefinitionDto) {
    return this.prisma.sanctionDefinition.create({ data: dto });
  }

  async remove(id: number) {
    const existing = await this.prisma.sanctionDefinition.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sancion no encontrada');
    await this.prisma.sanctionDefinition.delete({ where: { id } });
    return { message: 'Sancion eliminada' };
  }
}
