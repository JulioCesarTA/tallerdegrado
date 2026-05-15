import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        camera: { select: { id: true, name: true } },
        alertType: { select: { id: true, name: true } },
      },
    });
  }

  async createInternalAlert(data: { typeName: string; cameraId?: number }) {
    const alertType = await this.prisma.alertType.findFirst({ where: { name: data.typeName } });
    if (!alertType) return;
    return this.prisma.alert.create({
      data: { alertTypeId: alertType.id, cameraId: data.cameraId ?? null },
    });
  }

  async remove(id: number) {
    const alert = await this.prisma.alert.findUnique({ where: { id }, select: { id: true } });
    if (!alert) throw new NotFoundException('Alerta no encontrada');
    await this.prisma.alert.delete({ where: { id } });
    return { message: 'Alerta eliminada' };
  }
}
