'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { StatCard } from '@/components/stat-card';
import { api } from '@/lib/api';
import { DashboardSummary } from '@/lib/types';

const alertTypeLabel: Record<string, string> = {
  camera_disconnected: 'Camara desconectada',
  camera_error: 'Error de camara',
  detection_failure: 'Fallo de deteccion',
  sanctioned_vehicle_attempt: 'Vehiculo sancionado',
  network_failure: 'Fallo de red',
  system_interruption: 'Interrupcion del sistema',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<DashboardSummary>('/events/summary')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="rounded-3xl bg-rose-50 p-6 text-rose-700">{error}</div>;
  if (!data) return <div className="rounded-3xl bg-white p-6">Cargando dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Vehiculos" value={data.totals.totalVehicles} hint="Registrados" />
        <StatCard label="Ingresos" value={data.totals.ingresos} hint="Total acumulado" />
        <StatCard label="Salidas" value={data.totals.salidas} hint="Total acumulado" />
        <StatCard label="Camaras" value={data.totals.totalCameras} hint="Configuradas" />
        <StatCard label="Sanciones activas" value={data.totals.activeSanctions} hint="Control disciplinario" />
        <StatCard label="Alertas" value={data.totals.totalAlerts} hint="Total registradas" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Accesos recientes">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-3 pr-4">Hora ingreso</th>
                  <th className="pb-3 pr-4">Placa</th>
                  <th className="pb-3 pr-4">Camara entrada</th>
                  <th className="pb-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAccess.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="py-3 pr-4 text-slate-500">
                      {new Date(log.ingresoAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 font-medium">{log.vehicle?.plate ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-600">{log.ingresoCamera?.name ?? '—'}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${log.egresoAt == null ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {log.egresoAt == null ? 'dentro' : 'salido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Alertas recientes">
          <div className="space-y-3">
            {data.recentAlerts.length === 0 && (
              <p className="text-sm text-slate-500">Sin alertas recientes.</p>
            )}
            {data.recentAlerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-medium text-slate-950">
                  {alertTypeLabel[alert.alertType?.name ?? ''] ?? alert.alertType?.name ?? 'Alerta'}
                </p>
                {alert.camera && <p className="mt-1 text-xs text-slate-500">{alert.camera.name}</p>}
                <p className="mt-1 text-xs text-slate-400">{new Date(alert.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
