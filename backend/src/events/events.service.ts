import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const [totalVehicles, totalCameras, totalAlerts, activeSanctions, recentAccess, recentAlerts] =
      await Promise.all([
        this.prisma.vehicle.count(),
        this.prisma.camera.count(),
        this.prisma.alert.count(),
        this.prisma.sanction.count({
          where: { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        }),
        this.prisma.accessLog.findMany({
          orderBy: { ingresoAt: 'desc' },
          take: 8,
          include: {
            vehicle: { select: { id: true, plate: true, brand: true, model: true, color: true } },
            ingresoCamera: { select: { id: true, name: true } },
            salidaCamera: { select: { id: true, name: true } },
          },
        }),
        this.prisma.alert.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: {
            camera: { select: { id: true, name: true } },
            alertType: { select: { id: true, name: true } },
          },
        }),
      ]);

    const ingresos = await this.prisma.accessLog.count();
    const salidas = await this.prisma.accessLog.count({ where: { egresoAt: { not: null } } });

    return {
      totals: { totalVehicles, totalCameras, totalAlerts, activeSanctions, ingresos, salidas },
      recentAccess,
      recentAlerts,
    };
  }
}
