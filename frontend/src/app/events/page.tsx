'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { RegistroAcceso, Vehiculo } from '@/lib/types';

type AccessCard = RegistroAcceso & { vehiculo: Vehiculo };

function fmt(dt: string) {
  return new Date(dt).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function estadoColor(estado: string) {
  if (estado === 'ingreso')  return 'bg-emerald-100 text-emerald-700';
  if (estado === 'salida')   return 'bg-slate-100 text-slate-600';
  return 'bg-rose-100 text-rose-700';
}

export default function EventsPage() {
  const [cards, setCards]   = useState<AccessCard[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError]   = useState('');

  async function load(q?: string) {
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : '';
      const vehicles = await api<Vehiculo[]>(`/vehicles${params}`);
      const all: AccessCard[] = [];
      for (const v of vehicles) {
        for (const log of v.registrosAcceso ?? []) {
          all.push({ ...log, vehiculo: v });
        }
      }
      all.sort((a, b) => new Date(b.horaIngreso).getTime() - new Date(a.horaIngreso).getTime());
      setCards(all);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <SectionCard title="Historial de accesos">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
          placeholder="Buscar por placa"
          className="max-w-xs"
        />
      </SectionCard>

      {error && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {cards.length === 0 && !error && (
        <p className="text-sm text-slate-400">Sin registros.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const v = card.vehiculo;
          return (
            <article
              key={card.id}
              className="rounded-3xl border border-slate-200 bg-white overflow-hidden"
            >
              {/* Evidence photo */}
              <div className="relative h-40 w-full bg-slate-100 flex items-center justify-center">
                {card.urlEvidencia ? (
                  <Image
                    src={card.urlEvidencia}
                    alt={`Evidencia ${v.placa}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-3xl font-bold tracking-widest text-slate-400">{v.placa}</span>
                )}
                {/* Estado badge over image */}
                <span className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold capitalize ${estadoColor(card.estado)}`}>
                  {card.estado}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Plate */}
                <p className="text-xl font-bold tracking-widest text-slate-800">{v.placa}</p>

                {/* Vehicle fields */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs">Marca</span>
                    <p className="font-medium text-slate-700">{v.marca || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Modelo</span>
                    <p className="font-medium text-slate-700">{v.modelo || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Color</span>
                    <p className="font-medium text-slate-700">{v.color || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Tipo</span>
                    <p className="font-medium text-slate-700 capitalize">{v.tipoVehiculo?.nombre || '—'}</p>
                  </div>
                </div>

                {v.caracteristicas && (
                  <div>
                    <span className="text-slate-400 text-xs">Características</span>
                    <p className="text-sm text-slate-600">{v.caracteristicas}</p>
                  </div>
                )}

                {/* Access timestamps */}
                <div className="border-t border-slate-100 pt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ingreso</span>
                    <span>{fmt(card.horaIngreso)}</span>
                  </div>
                  {card.horaSalida && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Salida</span>
                      <span>{fmt(card.horaSalida)}</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
