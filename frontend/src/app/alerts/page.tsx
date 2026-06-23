'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Alerta } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const typeLabel: Record<string, string> = {
  camera_disconnected:        'Camara desconectada',
  camera_error:               'Error de camara',
  detection_failure:          'Fallo de deteccion',
  sanctioned_vehicle_attempt: 'Vehiculo sancionado',
  network_failure:            'Fallo de red',
  system_interruption:        'Interrupcion del sistema',
};

const estadoColor: Record<string, string> = {
  pendiente:     'bg-amber-100 text-amber-700',
  resuelto:      'bg-emerald-100 text-emerald-700',
  mantenimiento: 'bg-blue-100 text-blue-700',
};

const ESTADOS = ['pendiente', 'mantenimiento', 'resuelto'];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alerta[]>([]);

  async function load() {
    setAlerts(await api<Alerta[]>('/alerts'));
  }

  useEffect(() => {
    load();

    // Listen for new alerts triggered by camera disconnects
    const socket: Socket = io(`${BACKEND_URL}/stream`, { transports: ['websocket'] });
    socket.on('alert:new', () => load());

    return () => { socket.disconnect(); };
  }, []);

  async function updateStatus(id: number, estado: string) {
    const updated = await api<Alerta>(`/alerts/${id}`, {
      method: 'PATCH',
      body: { estado },
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  async function remove(id: number) {
    await api(`/alerts/${id}`, { method: 'DELETE' });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
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
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-semibold">
                    {typeLabel[alert.tipoAlerta] ?? alert.tipoAlerta ?? 'Alerta'}
                  </h4>
                  {alert.estadoAlerta && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${estadoColor[alert.estadoAlerta] ?? 'bg-slate-100 text-slate-600'}`}>
                      {alert.estadoAlerta}
                    </span>
                  )}
                </div>
                {alert.camara && (
                  <p className="text-sm text-slate-600">Camara: {alert.camara.nombre}</p>
                )}
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
                  {new Date(alert.creadoEn).toLocaleString('es-BO')}
                </p>

                {/* Estado selector */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Cambiar estado:</span>
                  <div className="flex gap-1">
                    {ESTADOS.map((est) => (
                      <button
                        key={est}
                        onClick={() => updateStatus(alert.id, est)}
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                          alert.estadoAlerta === est
                            ? estadoColor[est] + ' ring-2 ring-offset-1 ring-current'
                            : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400'
                        }`}
                      >
                        {est}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => remove(alert.id)}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white shrink-0"
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
