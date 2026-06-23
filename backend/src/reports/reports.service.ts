import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalVehiculos,
      totalCamaras,
      sancionesActivas,
      totalAlertas,
      recentAccessLogs,
      allAlerts,
      topVehiclesRaw,
      vehiculosAdentroCount,
      vehiculosRechazadosCount,
      vehiculosSalidosCount,
      sancionadosHoy,
      alertasPendiente,
      alertasResuelto,
      alertasMantenimiento,
      puntosAcceso,
    ] = await Promise.all([
      this.prisma.vehiculo.count(),
      this.prisma.camara.count(),
      this.prisma.sancion.count({
        where: { OR: [{ fechaFin: null }, { fechaFin: { gt: now } }] },
      }),
      this.prisma.alerta.count(),
      this.prisma.registroAcceso.findMany({
        where: { fecha: { gte: sevenDaysAgo } },
        select: { horaIngreso: true, horaSalida: true, estado: true, puntoAccesoIngresoId: true, puntoAccesoEgresoId: true },
      }),
      this.prisma.alerta.findMany({ select: { tipoAlerta: true } }),
      this.prisma.registroAcceso.groupBy({
        by: ['vehiculoId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prisma.registroAcceso.count({
        where: { estado: 'ingreso', horaSalida: null },
      }),
      this.prisma.registroAcceso.count({
        where: { estado: 'denegado', fecha: { gte: todayStart } },
      }),
      this.prisma.registroAcceso.count({
        where: { estado: 'salida', fecha: { gte: todayStart } },
      }),
      this.prisma.sancion.count({
        where: { fechaInicio: { gte: todayStart } },
      }),
      this.prisma.alerta.count({
        where: { estadoAlerta: 'pendiente' },
      }),
      this.prisma.alerta.count({
        where: { estadoAlerta: 'resuelto' },
      }),
      this.prisma.alerta.count({
        where: { estadoAlerta: 'mantenimiento' },
      }),
      this.prisma.puntoAcceso.findMany({
        select: { id: true, nombre: true },
      }),
    ]);

    // Build day map with rechazados
    const dayMap: Record<string, { day: string; ingresos: number; salidas: number; rechazados: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' });
      dayMap[key] = { day: label, ingresos: 0, salidas: 0, rechazados: 0 };
    }
    for (const log of recentAccessLogs) {
      const ingresoKey = new Date(log.horaIngreso).toISOString().slice(0, 10);
      if (log.estado === 'ingreso' && dayMap[ingresoKey]) dayMap[ingresoKey].ingresos++;
      if (log.estado === 'denegado' && dayMap[ingresoKey]) dayMap[ingresoKey].rechazados++;
      if (log.estado === 'salida' && log.horaSalida) {
        const salidaKey = new Date(log.horaSalida).toISOString().slice(0, 10);
        if (dayMap[salidaKey]) dayMap[salidaKey].salidas++;
      }
    }
    const accessByDay = Object.values(dayMap);

    // Build alerts by type
    const alertCounts: Record<string, number> = {};
    for (const alert of allAlerts) {
      const typeName = alert.tipoAlerta;
      alertCounts[typeName] = (alertCounts[typeName] || 0) + 1;
    }
    const alertsByType = Object.entries(alertCounts).map(([type, count]) => ({ type, count }));

    // Top vehicles
    const vehiculoIds = topVehiclesRaw.map((v) => v.vehiculoId);
    const vehiculos = await this.prisma.vehiculo.findMany({
      where: { id: { in: vehiculoIds } },
      select: { id: true, placa: true },
    });
    const vehiculoMap = Object.fromEntries(vehiculos.map((v) => [v.id, v.placa]));
    const topVehicles = topVehiclesRaw.map((v) => ({
      plate: vehiculoMap[v.vehiculoId] ?? String(v.vehiculoId),
      count: v._count.id,
    }));

    // Por punto de acceso (last 7 days)
    const porPuntoAccesoMap: Record<number, { nombre: string; ingresos: number; salidas: number }> = {};
    for (const pa of puntosAcceso) {
      porPuntoAccesoMap[pa.id] = { nombre: pa.nombre, ingresos: 0, salidas: 0 };
    }
    for (const log of recentAccessLogs) {
      if (log.estado === 'ingreso' && log.puntoAccesoIngresoId && porPuntoAccesoMap[log.puntoAccesoIngresoId]) {
        porPuntoAccesoMap[log.puntoAccesoIngresoId].ingresos++;
      }
      if (log.estado === 'salida' && log.puntoAccesoEgresoId && porPuntoAccesoMap[log.puntoAccesoEgresoId]) {
        porPuntoAccesoMap[log.puntoAccesoEgresoId].salidas++;
      }
    }
    const porPuntoAcceso = Object.values(porPuntoAccesoMap);

    return {
      totals: { totalVehiculos, totalCamaras, sancionesActivas, totalAlertas },
      vehiculosAdentro: vehiculosAdentroCount,
      vehiculosRechazados: vehiculosRechazadosCount,
      vehiculosSalidos: vehiculosSalidosCount,
      sancionadosHoy,
      alertasPorEstado: {
        pendiente: alertasPendiente,
        resuelto: alertasResuelto,
        mantenimiento: alertasMantenimiento,
      },
      accessByDay,
      alertsByType,
      topVehicles,
      porPuntoAcceso,
    };
  }
}
