'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { SectionCard } from '@/components/section-card';
import { StatCard } from '@/components/stat-card';
import { ReportsOverview } from '@/lib/types';
import { getToken } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const ALERT_LABELS: Record<string, string> = {
  camera_disconnected: 'Camara desconectada',
  camera_error: 'Error de camara',
  detection_failure: 'Fallo de deteccion',
  sanctioned_vehicle_attempt: 'Vehiculo sancionado',
  network_failure: 'Fallo de red',
  system_interruption: 'Interrupcion del sistema',
};

const ALERT_COLORS: Record<string, string> = {
  camera_disconnected: '#ef4444',
  camera_error: '#f97316',
  detection_failure: '#eab308',
  sanctioned_vehicle_attempt: '#8b5cf6',
  network_failure: '#6366f1',
  system_interruption: '#ec4899',
};

const FALLBACK_COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#6366f1', '#ec4899'];

function CustomTooltipAccesos({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name === 'ingresos' ? 'Ingresos' : p.name === 'salidas' ? 'Salidas' : 'Rechazados'}:{' '}
          <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function CustomTooltipAlertas({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700">{ALERT_LABELS[d.type] ?? d.type}</p>
      <p className="text-slate-500">Cantidad: <span className="font-bold text-slate-800">{d.count}</span></p>
    </div>
  );
}

function CustomTooltipVehiculos({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700">{d.plate}</p>
      <p className="text-slate-500">Accesos: <span className="font-bold text-slate-800">{d.count}</span></p>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData]             = useState<ReportsOverview | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted]       = useState(false);
  const [connected, setConnected]   = useState(false);
  const socketRef                   = useRef<Socket | null>(null);

  const handleData = useCallback((d: ReportsOverview) => {
    setData(d);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    setMounted(true);

    const token = getToken();
    const socket = io(`${BACKEND_URL}/reports`, {
      transports: ['websocket'],
      auth: token ? { token } : undefined,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('reports:subscribe');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('reports:data', handleData);

    return () => {
      socket.disconnect();
    };
  }, [handleData]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">Cargando reportes...</div>
      </div>
    );
  }

  const totalAccesos = data.accessByDay.reduce((s, d) => s + d.ingresos + d.salidas, 0);

  function exportExcel() {
    if (!data) return;

    const now = new Date();
    const fechaStr = now.toLocaleString('es-BO');
    const wb = XLSX.utils.book_new();

    /* ── Hoja 1: Resumen general ── */
    const resumen = [
      ['REPORTE DE CONTROL VEHICULAR — UAGRM'],
      [`Generado: ${fechaStr}`],
      [],
      ['TOTALES GENERALES', ''],
      ['Vehiculos registrados', data.totals.totalVehiculos],
      ['Camaras configuradas', data.totals.totalCamaras],
      ['Sanciones activas', data.totals.sancionesActivas],
      ['Alertas totales', data.totals.totalAlertas],
      [],
      ['ESTADO OPERACIONAL HOY', ''],
      ['Vehiculos adentro ahora', data.vehiculosAdentro],
      ['Rechazados hoy', data.vehiculosRechazados],
      ['Salidos hoy', data.vehiculosSalidos],
      ['Sancionados hoy', data.sancionadosHoy],
      [],
      ['ALERTAS POR ESTADO', ''],
      ['Pendientes', data.alertasPorEstado.pendiente],
      ['Resueltas', data.alertasPorEstado.resuelto],
      ['En mantenimiento', data.alertasPorEstado.mantenimiento],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    wsResumen['!cols'] = [{ wch: 32 }, { wch: 18 }];
    wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    /* ── Hoja 2: Flujo vehicular por dia ── */
    const flujoHeader = [['Fecha', 'Ingresos', 'Salidas', 'Rechazados', 'Total']];
    const flujoRows = data.accessByDay.map((d) => [
      d.day,
      d.ingresos,
      d.salidas,
      d.rechazados,
      d.ingresos + d.salidas + d.rechazados,
    ]);
    const wsFlujo = XLSX.utils.aoa_to_sheet([...flujoHeader, ...flujoRows]);
    wsFlujo['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsFlujo, 'Flujo Vehicular');

    /* ── Hoja 3: Alertas por tipo ── */
    const alertasHeader = [['Tipo de Alerta', 'Cantidad']];
    const alertasRows = data.alertsByType.map((a) => [
      ALERT_LABELS[a.type] ?? a.type,
      a.count,
    ]);
    const wsAlertas = XLSX.utils.aoa_to_sheet([...alertasHeader, ...alertasRows]);
    wsAlertas['!cols'] = [{ wch: 36 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsAlertas, 'Alertas por Tipo');

    /* ── Hoja 4: Top vehiculos ── */
    const topHeader = [['Placa', 'Accesos registrados']];
    const topRows = data.topVehicles.map((v) => [v.plate, v.count]);
    const wsTop = XLSX.utils.aoa_to_sheet([...topHeader, ...topRows]);
    wsTop['!cols'] = [{ wch: 14 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top Vehiculos');

    /* ── Hoja 5: Por punto de acceso ── */
    if (data.porPuntoAcceso.length > 0) {
      const puntoHeader = [['Punto de Acceso', 'Ingresos', 'Salidas', 'Total']];
      const puntoRows = data.porPuntoAcceso.map((p) => [
        p.nombre,
        p.ingresos,
        p.salidas,
        p.ingresos + p.salidas,
      ]);
      const wsPunto = XLSX.utils.aoa_to_sheet([...puntoHeader, ...puntoRows]);
      wsPunto['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsPunto, 'Puntos de Acceso');
    }

    const fileName = `reporte_vehicular_${now.toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  return (
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {connected ? (
                <span className="text-emerald-500 font-medium">En vivo</span>
              ) : (
                <span className="text-rose-400">Desconectado</span>
              )}
              {lastUpdated && (
                <span className="ml-2 text-slate-400">
                  &middot; Ultima actualizacion: {lastUpdated.toLocaleTimeString('es-BO')}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={exportExcel}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Exportar Excel
          </button>
        </div>

        {/* Totals */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Vehiculos registrados" value={data.totals.totalVehiculos} hint="Total en sistema" />
          <StatCard label="Camaras" value={data.totals.totalCamaras} hint="Configuradas" />
          <StatCard label="Sanciones activas" value={data.totals.sancionesActivas} hint="En seguimiento" />
          <StatCard label="Alertas totales" value={data.totals.totalAlertas} hint="Registradas" />
        </div>

        {/* Operational stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Adentro ahora" value={data.vehiculosAdentro} hint="Con ingreso activo" />
          <StatCard label="Rechazados hoy" value={data.vehiculosRechazados} hint="Acceso denegado" />
          <StatCard label="Salidos hoy" value={data.vehiculosSalidos} hint="Registros de salida" />
          <StatCard label="Sancionados hoy" value={data.sancionadosHoy} hint="Nuevas sanciones" />
        </div>

        {/* Alertas por estado */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Alertas pendientes" value={data.alertasPorEstado.pendiente} hint="Sin resolver" />
          <StatCard label="Alertas resueltas" value={data.alertasPorEstado.resuelto} hint="Cerradas" />
          <StatCard label="En mantenimiento" value={data.alertasPorEstado.mantenimiento} hint="En proceso" />
        </div>

        {/* Bar chart access by day */}
        <SectionCard
          title="Flujo vehicular — ultimos 7 dias"
          actions={
            <span className="text-sm text-slate-400">{totalAccesos} accesos totales</span>
          }
        >
          {mounted && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.accessByDay} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltipAccesos />} cursor={{ fill: '#f8fafc' }} />
                <Legend
                  formatter={(value) =>
                    value === 'ingresos' ? 'Ingresos' : value === 'salidas' ? 'Salidas' : 'Rechazados'
                  }
                  wrapperStyle={{ fontSize: 12, color: '#64748b' }}
                />
                <Bar dataKey="ingresos"   fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="salidas"    fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="rechazados" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Alerts by type */}
          <SectionCard title="Distribucion de alertas">
            {mounted && data.alertsByType.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.alertsByType}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {data.alertsByType.map((entry, index) => (
                        <Cell
                          key={entry.type}
                          fill={ALERT_COLORS[entry.type] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltipAlertas />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {data.alertsByType.map((entry, index) => (
                    <div key={entry.type} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ALERT_COLORS[entry.type] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] }}
                      />
                      <span className="text-slate-600 flex-1 truncate">
                        {ALERT_LABELS[entry.type] ?? entry.type}
                      </span>
                      <span className="font-semibold text-slate-800">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
                Sin alertas registradas
              </div>
            )}
          </SectionCard>

          {/* Top vehicles */}
          <SectionCard title="Top 5 vehiculos con mas accesos">
            {mounted && data.topVehicles.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.topVehicles} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="plate"
                    tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip content={<CustomTooltipVehiculos />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
                Sin datos de accesos aun
              </div>
            )}
          </SectionCard>

        </div>

        {/* Por punto de acceso */}
        {data.porPuntoAcceso.length > 0 && (
          <SectionCard title="Accesos por punto de acceso">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.porPuntoAcceso.map((pa) => (
                <div
                  key={pa.nombre}
                  className="rounded-2xl border border-slate-200 p-4 space-y-1"
                >
                  <p className="font-semibold text-slate-800 truncate">{pa.nombre}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-600 font-medium">
                      Ingresos: {pa.ingresos}
                    </span>
                    <span className="text-indigo-600 font-medium">
                      Salidas: {pa.salidas}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

      </div>
  );
}
