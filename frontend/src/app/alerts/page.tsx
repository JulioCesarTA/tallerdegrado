'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Alert } from '@/lib/types';

const typeLabel: Record<string, string> = {
  camera_disconnected: 'Camara desconectada',
  camera_error: 'Error de camara',
  detection_failure: 'Fallo de deteccion',
  sanctioned_vehicle_attempt: 'Vehiculo sancionado',
  network_failure: 'Fallo de red',
  system_interruption: 'Interrupcion del sistema',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  async function load() {
    setAlerts(await api<Alert[]>('/alerts'));
  }

  useEffect(() => { load(); }, []);

  async function remove(id: number) {
    await api(`/alerts/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <SectionCard
      title="Alertas operativas"
      actions={
        <span className="rounded-full bg-slate-950 px-4 py-2 text-sm text-white">
          {alerts.length} alertas
        </span>
      }
    >
      <div className="space-y-4">
        {alerts.length === 0 && (
          <p className="text-sm text-slate-500">Sin alertas registradas.</p>
        )}
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h4 className="text-lg font-semibold">
                  {typeLabel[alert.alertType?.name ?? ''] ?? alert.alertType?.name ?? 'Alerta'}
                </h4>
                {alert.camera && (
                  <p className="mt-1 text-sm text-slate-600">Camara: {alert.camera.name}</p>
                )}
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                  {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => remove(alert.id)}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white"
              >
                Descartar
              </button>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
