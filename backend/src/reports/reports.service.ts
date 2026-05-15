import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [
      totalVehicles,
      totalCameras,
      activeSanctions,
      totalAlerts,
      recentAccessLogs,
      allAlerts,
      topVehiclesRaw,
    ] = await Promise.all([
      this.prisma.vehicle.count(),
      this.prisma.camera.count(),
      this.prisma.sanction.count({
        where: { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      }),
      this.prisma.alert.count(),
      this.prisma.accessLog.findMany({
        where: { ingresoAt: { gte: sevenDaysAgo } },
        select: { ingresoAt: true, egresoAt: true },
      }),
      this.prisma.alert.findMany({ include: { alertType: { select: { name: true } } } }),
      this.prisma.accessLog.groupBy({
        by: ['vehicleId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const dayMap: Record<string, { day: string; ingresos: number; salidas: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' });
      dayMap[key] = { day: label, ingresos: 0, salidas: 0 };
    }
    for (const log of recentAccessLogs) {
      const ingresoKey = new Date(log.ingresoAt).toISOString().slice(0, 10);
      if (dayMap[ingresoKey]) dayMap[ingresoKey].ingresos++;
      if (log.egresoAt) {
        const egresoKey = new Date(log.egresoAt).toISOString().slice(0, 10);
        if (dayMap[egresoKey]) dayMap[egresoKey].salidas++;
      }
    }
    const accessByDay = Object.values(dayMap);

    const alertCounts: Record<string, number> = {};
    for (const alert of allAlerts) {
      const typeName = alert.alertType.name;
      alertCounts[typeName] = (alertCounts[typeName] || 0) + 1;
    }
    const alertsByType = Object.entries(alertCounts).map(([type, count]) => ({ type, count }));

    const vehicleIds = topVehiclesRaw.map((v) => v.vehicleId);
    const vehicles = await this.prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, plate: true },
    });
    const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v.plate]));
    const topVehicles = topVehiclesRaw.map((v) => ({
      plate: vehicleMap[v.vehicleId] ?? String(v.vehicleId),
      count: v._count.id,
    }));

    return {
      totals: { totalVehicles, totalCameras, activeSanctions, totalAlerts },
      accessByDay,
      alertsByType,
      topVehicles,
    };
  }
}
