'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Parqueo, Plaza } from '@/lib/types';

const TIPOS = ['auto', 'moto', 'discapacitado'];
const ESTADOS = ['libre', 'ocupada'];

const emptyForm = { parqueoId: 0, codigo: '', tipo: TIPOS[0], estado: ESTADOS[0] };

export default function PlazasPage() {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [parqueos, setParqueos] = useState<Parqueo[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [plazasData, parqueosData] = await Promise.all([
        api<Plaza[]>('/plazas'),
        api<Parqueo[]>('/parqueos'),
      ]);
      setPlazas(plazasData);
      setParqueos(parqueosData);
      setForm((f) => ({ ...f, parqueoId: f.parqueoId || parqueosData[0]?.id || 0 }));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }

  useEffect(() => { load(); }, []);

  async function onSubmit() {
    try {
      await api('/plazas', { method: 'POST', body: { ...form, parqueoId: Number(form.parqueoId) } });
      setForm({ ...emptyForm, parqueoId: parqueos[0]?.id || 0 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la plaza');
    }
  }

  async function remove(id: number) {
    try {
      await api(`/plazas/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <SectionCard title="Plazas">
        {error && <div className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="pb-3 pr-4">Codigo</th>
                <th className="pb-3 pr-4">Parqueo</th>
                <th className="pb-3 pr-4">Tipo</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {plazas.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2.5 pr-4 font-medium">{p.codigo}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{p.parqueo?.nombre ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{p.tipo}</td>
                  <td className="py-2.5 pr-4">
                    <span className={p.estado === 'libre' ? 'text-emerald-600' : 'text-rose-600'}>{p.estado}</span>
                  </td>
                  <td className="py-2.5">
                    <button onClick={() => remove(p.id)} className="text-xs text-rose-500 hover:text-rose-700">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Nueva plaza">
        <form action={onSubmit} className="space-y-3">
          <select value={form.parqueoId} onChange={(e) => setForm({ ...form, parqueoId: Number(e.target.value) })}>
            {parqueos.length === 0 && <option value={0}>Crea un parqueo primero</option>}
            {parqueos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Codigo (ej. A-01)" required />
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Crear plaza</button>
        </form>
      </SectionCard>
    </div>
  );
}
