import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSanctionDefinitionDto } from './dto/create-sanction-definition.dto';

@Injectable()
export class SanctionDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tipoSancion.findMany({ orderBy: { nombre: 'asc' } });
  }

  create(dto: CreateSanctionDefinitionDto) {
    return this.prisma.tipoSancion.create({
      data: {
        nombre: dto.nombre,
        motivo: dto.motivo,
        duracionDias: dto.duracionDias,
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.tipoSancion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tipo de sancion no encontrado');
    await this.prisma.tipoSancion.delete({ where: { id } });
    return { message: 'Tipo de sancion eliminado' };
  }
}
