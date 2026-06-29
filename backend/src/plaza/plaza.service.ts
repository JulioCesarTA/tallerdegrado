import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlazaDto } from './dto/create-plaza.dto';
import { UpdatePlazaDto } from './dto/update-plaza.dto';

const plazaInclude = {
  parqueo: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class PlazaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.plaza.findMany({ include: plazaInclude, orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const plaza = await this.prisma.plaza.findUnique({ where: { id }, include: plazaInclude });
    if (!plaza) throw new NotFoundException('Plaza no encontrada');
    return plaza;
  }

  async create(dto: CreatePlazaDto) {
    await this.ensureParqueoExists(dto.parqueoId);
    return this.prisma.plaza.create({ data: dto, include: plazaInclude });
  }

  async update(id: number, dto: UpdatePlazaDto) {
    await this.ensureExists(id);
    if (dto.parqueoId) await this.ensureParqueoExists(dto.parqueoId);
    return this.prisma.plaza.update({ where: { id }, data: dto, include: plazaInclude });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.plaza.delete({ where: { id } });
    return { message: 'Plaza eliminada' };
  }

  private async ensureExists(id: number) {
    const plaza = await this.prisma.plaza.findUnique({ where: { id }, select: { id: true } });
    if (!plaza) throw new NotFoundException('Plaza no encontrada');
  }

  private async ensureParqueoExists(parqueoId: number) {
    const parqueo = await this.prisma.parqueo.findUnique({ where: { id: parqueoId }, select: { id: true } });
    if (!parqueo) throw new NotFoundException('Parqueo no encontrado');
  }
}
