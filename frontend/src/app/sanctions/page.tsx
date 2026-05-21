'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { TipoSancion } from '@/lib/types';

const emptyForm = { nombre: '', motivo: '', duracionDias: 7 };

export default function SanctionsPage() {
  const [definitions, setDefinitions] = useState<TipoSancion[]>([]);
  const [form, setForm]               = useState(emptyForm);
  const [error, setError]             = useState('');

  async function load() {
    setDefinitions(await api<TipoSancion[]>('/sanction-definitions'));
  }

  useEffect(() => { load(); }, []);

  async function onSubmit() {
    setError('');
    try {
      await api('/sanction-definitions', {
        method: 'POST',
        body: { ...form, duracionDias: Number(form.duracionDias) },
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  async function remove(id: number) {
    await api(`/sanction-definitions/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard title="Tipos de sancion">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="pb-3 pr-4">Nombre</th>
                <th className="pb-3 pr-4">Motivo</th>
                <th className="pb-3 pr-4">Duracion</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {definitions.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-slate-400">No hay tipos de sancion definidos.</td></tr>
              )}
              {definitions.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="py-2.5 pr-4 font-medium">{d.nombre}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{d.motivo}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{d.duracionDias} dias</td>
                  <td className="py-2.5">
                    <button onClick={() => remove(d.id)} className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-100">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Nuevo tipo de sancion">
        <form action={onSubmit} className="space-y-3">
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" required />
          <textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Motivo" rows={3} required />
          <div>
            <label className="mb-1 block text-xs text-slate-500">Duracion (dias)</label>
            <input type="number" min={1} max={365} value={form.duracionDias} onChange={(e) => setForm({ ...form, duracionDias: Number(e.target.value) })} required />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Guardar</button>
        </form>
      </SectionCard>
    </div>
  );
}
