import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.alerta.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        camara: { select: { id: true, nombre: true } },
        tipoAlerta: { select: { id: true, nombre: true } },
        estadoAlerta: { select: { id: true, nombre: true } },
      },
    });
  }

  async createInternalAlert(data: { typeName: string; camaraId?: number }) {
    const tipoAlerta = await this.prisma.tipoAlerta.findFirst({ where: { nombre: data.typeName } });
    if (!tipoAlerta) return;

    const estadoPendiente = await this.prisma.estadoAlerta.findFirst({ where: { nombre: 'pendiente' } });
    if (!estadoPendiente) return;

    return this.prisma.alerta.create({
      data: {
        tipoAlertaId: tipoAlerta.id,
        camaraId: data.camaraId ?? null,
        estadoAlertaId: estadoPendiente.id,
      },
    });
  }

  async updateStatus(id: number, estadoNombre: string) {
    const alerta = await this.prisma.alerta.findUnique({ where: { id }, select: { id: true } });
    if (!alerta) throw new NotFoundException('Alerta no encontrada');

    const estado = await this.prisma.estadoAlerta.findFirst({
      where: { nombre: { equals: estadoNombre, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!estado) throw new NotFoundException(`Estado "${estadoNombre}" no existe`);

    return this.prisma.alerta.update({
      where: { id },
      data: { estadoAlertaId: estado.id },
      include: {
        camara:      { select: { id: true, nombre: true } },
        tipoAlerta:  { select: { id: true, nombre: true } },
        estadoAlerta: { select: { id: true, nombre: true } },
      },
    });
  }

  async remove(id: number) {
    const alerta = await this.prisma.alerta.findUnique({ where: { id }, select: { id: true } });
    if (!alerta) throw new NotFoundException('Alerta no encontrada');
    await this.prisma.alerta.delete({ where: { id } });
    return { message: 'Alerta eliminada' };
  }
}
