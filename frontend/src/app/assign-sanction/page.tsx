'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { TipoSancion, Vehiculo } from '@/lib/types';

export default function AssignSanctionPage() {
  const [plate, setPlate]                       = useState('');
  const [vehicle, setVehicle]                   = useState<Vehiculo | null>(null);
  const [notFound, setNotFound]                 = useState(false);
  const [definitions, setDefinitions]           = useState<TipoSancion[]>([]);
  const [tipoSancionId, setTipoSancionId]       = useState<string>('');
  const [success, setSuccess]                   = useState('');
  const [error, setError]                       = useState('');

  useEffect(() => {
    api<TipoSancion[]>('/sanction-definitions').then((data) => {
      setDefinitions(data);
      if (data.length > 0) setTipoSancionId(String(data[0].id));
    });
  }, []);

  async function search() {
    setVehicle(null); setNotFound(false); setSuccess(''); setError('');
    try {
      setVehicle(await api<Vehiculo>(`/vehicles/history/${plate.toUpperCase()}`));
    } catch {
      setNotFound(true);
    }
  }

  async function onSubmit() {
    if (!vehicle || !tipoSancionId) return;
    setError(''); setSuccess('');
    try {
      await api('/sanctions', {
        method: 'POST',
        body: { vehiculoId: vehicle.id, tipoSancionId: Number(tipoSancionId) },
      });
      const def = definitions.find((d) => d.id === Number(tipoSancionId));
      setSuccess(`Sancion "${def?.nombre}" asignada a ${vehicle.placa}.`);
      setVehicle(null); setPlate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar la sancion');
    }
  }

  const selectedDef = definitions.find((d) => d.id === Number(tipoSancionId));

  return (
    <div className="max-w-xl space-y-6">
      <SectionCard title="Buscar vehiculo">
        <div className="flex gap-3">
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="Placa (ej: ABC123)"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <button onClick={search} className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
            Buscar
          </button>
        </div>
        {notFound && <p className="mt-3 text-sm text-rose-600">Vehiculo no encontrado.</p>}
      </SectionCard>

      {vehicle && (
        <SectionCard title="Asignar sancion">
          <div className="mb-4 rounded-2xl border border-slate-200 p-4 space-y-1">
            <p className="font-semibold text-lg">{vehicle.placa}</p>
            {vehicle.marca && (
              <p className="text-sm text-slate-500">{vehicle.marca} {vehicle.modelo} · {vehicle.color}</p>
            )}
            {vehicle.tipoVehiculo && (
              <p className="text-sm text-slate-400 capitalize">{vehicle.tipoVehiculo}</p>
            )}
          </div>
          <form action={onSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Tipo de sancion</label>
              <select value={tipoSancionId} onChange={(e) => setTipoSancionId(e.target.value)} required>
                {definitions.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
            {selectedDef && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 space-y-1">
                <p>{selectedDef.motivo}</p>
                <p className="text-xs text-slate-400">
                  Duracion: {selectedDef.duracionDias ? `${selectedDef.duracionDias} dias` : 'Indefinida'}
                </p>
              </div>
            )}
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
              Registrar sancion
            </button>
          </form>
        </SectionCard>
      )}

      {success && (
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>
      )}
    </div>
  );
}
