'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { AccessLog, Vehicle } from '@/lib/types';

export default function EventsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');

  async function load(q?: string) {
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : '';
      const data = await api<Vehicle[]>(`/vehicles${params}`);
      setVehicles(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    load(val);
  }

  function fmt(dt: string) {
    return new Date(dt).toLocaleString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Buscar vehiculo">
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por placa"
          className="max-w-xs"
        />
      </SectionCard>

      {error && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((v) => (
          <article
            key={v.id}
            onClick={() => setSelected(selected?.id === v.id ? null : v)}
            className="cursor-pointer rounded-3xl border border-slate-200 bg-white overflow-hidden hover:border-slate-400 transition-colors"
          >
            <div className="h-24 w-full bg-slate-100 flex items-center justify-center">
              <span className="text-2xl font-bold tracking-widest text-slate-500">{v.plate}</span>
            </div>

            <div className="p-4 space-y-2">
              <p className="font-semibold">{v.plate}</p>
              <p className="text-sm text-slate-500">
                {[v.brand, v.model, v.color].filter(Boolean).join(' · ') || 'Sin datos'}
              </p>
              <div className="flex gap-3 text-xs text-slate-400">
                <span>{v.accessLogs?.length ?? 0} accesos</span>
                {v.tipoVehiculo && <span className="capitalize">{v.tipoVehiculo.name}</span>}
              </div>
            </div>

            {selected?.id === v.id && (
              <div className="border-t border-slate-100 p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Historial de accesos</p>
                  {(v.accessLogs?.length ?? 0) === 0 && (
                    <p className="text-xs text-slate-400">Sin registros.</p>
                  )}
                  <div className="space-y-1.5">
                    {v.accessLogs?.map((log: AccessLog) => (
                      <div key={log.id} className="flex items-center gap-3 text-xs">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${log.egresoAt == null ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {log.egresoAt == null ? 'dentro' : 'salido'}
                        </span>
                        <span className="text-slate-600">{fmt(log.ingresoAt)}</span>
                        {log.ingresoCamera && <span className="text-slate-400">{log.ingresoCamera.name}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
