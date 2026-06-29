import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParqueoDto } from './dto/create-parqueo.dto';
import { UpdateParqueoDto } from './dto/update-parqueo.dto';

@Injectable()
export class ParqueoService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.parqueo.findMany({
      include: { _count: { select: { plazas: true } } },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const parqueo = await this.prisma.parqueo.findUnique({ where: { id }, include: { plazas: true } });
    if (!parqueo) throw new NotFoundException('Parqueo no encontrado');
    return parqueo;
  }

  create(dto: CreateParqueoDto) {
    return this.prisma.parqueo.create({ data: dto });
  }

  async update(id: number, dto: UpdateParqueoDto) {
    await this.ensureExists(id);
    return this.prisma.parqueo.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.parqueo.delete({ where: { id } });
    return { message: 'Parqueo eliminado' };
  }

  private async ensureExists(id: number) {
    const parqueo = await this.prisma.parqueo.findUnique({ where: { id }, select: { id: true } });
    if (!parqueo) throw new NotFoundException('Parqueo no encontrado');
  }
}
