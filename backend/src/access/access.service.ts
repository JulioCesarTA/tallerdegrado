import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePuntoAccesoDto } from './dto/create-punto-acceso.dto';
import { UpdatePuntoAccesoDto } from './dto/update-punto-acceso.dto';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  // --- PuntoAcceso ---

  findAccessPoints() {
    return this.prisma.puntoAcceso.findMany({
      include: {
        camaraIngreso: true,
        camaraSalida: true,
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async createAccessPoint(dto: CreatePuntoAccesoDto) {
    try {
      return await this.prisma.puntoAcceso.create({
        data: {
          nombre: dto.nombre,
          ubicacion: dto.ubicacion,
          descripcion: dto.descripcion,
          estado: dto.estado,
          camaraIngresoId: dto.camaraIngresoId,
          camaraSalidaId: dto.camaraSalidaId,
          usuarioId: dto.usuarioId,
        },
        include: {
          camaraIngreso: true,
          camaraSalida: true,
          usuario: { select: { id: true, nombre: true, correo: true } },
        },
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2002') throw new ConflictException('Una de las camaras ya esta asignada a otro punto de acceso');
      if (code === 'P2003') throw new NotFoundException('Camara o usuario no encontrado');
      throw e;
    }
  }

  async updateAccessPoint(id: number, dto: UpdatePuntoAccesoDto) {
    const existing = await this.prisma.puntoAcceso.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Punto de acceso no encontrado');
    return this.prisma.puntoAcceso.update({
      where: { id },
      data: dto,
      include: {
        camaraIngreso: true,
        camaraSalida: true,
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
  }

  async removeAccessPoint(id: number) {
    const existing = await this.prisma.puntoAcceso.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Punto de acceso no encontrado');
    await this.prisma.puntoAcceso.delete({ where: { id } });
    return { message: 'Punto de acceso eliminado' };
  }
}
