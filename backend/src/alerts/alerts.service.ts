import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const ALERT_STATUSES = ['pendiente', 'mantenimiento', 'resuelto'] as const;

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.alerta.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        camara: { select: { id: true, nombre: true } },
      },
    });
  }

  createInternalAlert(data: { typeName: string; camaraId?: number }) {
    return this.prisma.alerta.create({
      data: {
        tipoAlerta: data.typeName,
        camaraId: data.camaraId ?? null,
        estadoAlerta: 'pendiente',
      },
    });
  }

  async updateStatus(id: number, estadoNombre: string) {
    const alerta = await this.prisma.alerta.findUnique({ where: { id }, select: { id: true } });
    if (!alerta) throw new NotFoundException('Alerta no encontrada');

    const estado = ALERT_STATUSES.find((e) => e.toLowerCase() === estadoNombre.toLowerCase());
    if (!estado) throw new NotFoundException(`Estado "${estadoNombre}" no existe`);

    return this.prisma.alerta.update({
      where: { id },
      data: { estadoAlerta: estado },
      include: {
        camara: { select: { id: true, nombre: true } },
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
