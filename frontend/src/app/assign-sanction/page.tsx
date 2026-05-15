'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { SanctionDefinition, Vehicle } from '@/lib/types';

export default function AssignSanctionPage() {
  const [plate, setPlate] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [definitions, setDefinitions] = useState<SanctionDefinition[]>([]);
  const [sanctionDefinitionId, setSanctionDefinitionId] = useState<string>('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<SanctionDefinition[]>('/sanction-definitions').then((data) => {
      setDefinitions(data);
      if (data.length > 0) setSanctionDefinitionId(String(data[0].id));
    });
  }, []);

  async function search() {
    setVehicle(null);
    setNotFound(false);
    setSuccess('');
    setError('');
    try {
      const found = await api<Vehicle>(`/vehicles/history/${plate.toUpperCase()}`);
      setVehicle(found);
    } catch {
      setNotFound(true);
    }
  }

  async function onSubmit() {
    if (!vehicle || !sanctionDefinitionId) return;
    setError('');
    setSuccess('');
    try {
      await api('/sanctions', {
        method: 'POST',
        body: { vehicleId: vehicle.id, sanctionDefinitionId: Number(sanctionDefinitionId) },
      });
      const def = definitions.find((d) => d.id === Number(sanctionDefinitionId));
      setSuccess(`Sancion "${def?.name}" asignada a ${vehicle.plate}.`);
      setVehicle(null);
      setPlate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar la sancion');
    }
  }

  const selectedDef = definitions.find((d) => d.id === Number(sanctionDefinitionId));

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
          <button
            onClick={search}
            className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            Buscar
          </button>
        </div>
        {notFound && <p className="mt-3 text-sm text-rose-600">Vehiculo no encontrado.</p>}
      </SectionCard>

      {vehicle && (
        <SectionCard title="Asignar sancion">
          <div className="mb-4 rounded-2xl border border-slate-200 p-4 space-y-1">
            <p className="font-semibold text-lg">{vehicle.plate}</p>
            {vehicle.brand && (
              <p className="text-sm text-slate-500">{vehicle.brand} {vehicle.model} · {vehicle.color}</p>
            )}
            {vehicle.tipoVehiculo && (
              <p className="text-sm text-slate-400 capitalize">{vehicle.tipoVehiculo.name}</p>
            )}
          </div>

          <form action={onSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Tipo de sancion</label>
              <select
                value={sanctionDefinitionId}
                onChange={(e) => setSanctionDefinitionId(e.target.value)}
                required
              >
                {definitions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            {selectedDef && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 space-y-1">
                <p>{selectedDef.reason}</p>
                <p className="text-xs text-slate-400">
                  Duracion: {selectedDef.durationDays ? `${selectedDef.durationDays} dias` : 'Indefinida'}
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
