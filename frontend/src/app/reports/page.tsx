'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { SectionCard } from '@/components/section-card';
import { StatCard } from '@/components/stat-card';
import { api } from '@/lib/api';
import { ReportsOverview } from '@/lib/types';

const ALERT_LABELS: Record<string, string> = {
  camera_disconnected: 'Cámara desconectada',
  camera_error: 'Error de cámara',
  detection_failure: 'Fallo de detección',
  sanctioned_vehicle_attempt: 'Vehículo sancionado',
  network_failure: 'Fallo de red',
  system_interruption: 'Interrupción del sistema',
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
          {p.name === 'ingresos' ? 'Ingresos' : 'Salidas'}: <span className="font-bold">{p.value}</span>
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
  const [data, setData] = useState<ReportsOverview | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchData = useCallback(() => {
    api<ReportsOverview>('/reports/overview').then((d) => {
      setData(d);
      setLastUpdated(new Date());
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">Cargando reportes...</div>
      </div>
    );
  }

  const totalAccesos = data.accessByDay.reduce((s, d) => s + d.ingresos + d.salidas, 0);

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Se actualiza cada 30 segundos
            {lastUpdated && (
              <span className="ml-2">
                · Última vez: {lastUpdated.toLocaleTimeString('es-BO')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vehículos" value={data.totals.totalVehicles} hint="Registrados" />
        <StatCard label="Cámaras" value={data.totals.totalCameras} hint="Configuradas" />
        <StatCard label="Sanciones activas" value={data.totals.activeSanctions} hint="En seguimiento" />
        <StatCard label="Alertas" value={data.totals.totalAlerts} hint="Total registradas" />
      </div>

      <SectionCard
        title="Flujo vehicular — últimos 7 días"
        actions={
          <span className="text-sm text-slate-400">
            {totalAccesos} accesos totales
          </span>
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
                formatter={(value) => value === 'ingresos' ? 'Ingresos' : 'Salidas'}
                wrapperStyle={{ fontSize: 12, color: '#64748b' }}
              />
              <Bar dataKey="ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="salidas" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">

        <SectionCard title="Distribución de alertas">
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

        <SectionCard title="Top 5 vehículos con más accesos">
          {mounted && data.topVehicles.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.topVehicles}
                layout="vertical"
                barCategoryGap="25%"
              >
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
              Sin datos de accesos aún
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
