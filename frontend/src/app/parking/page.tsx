'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Parqueo } from '@/lib/types';

const TIPOS = ['estudiante', 'docente', 'visitante'];

const emptyForm = { nombre: '', ubicacion: '', tipo: TIPOS[0] };

export default function ParkingPage() {
  const [parqueos, setParqueos] = useState<Parqueo[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function load() {
    try {
      setParqueos(await api<Parqueo[]>('/parqueos'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }

  useEffect(() => { load(); }, []);

  async function onSubmit() {
    try {
      await api('/parqueos', { method: 'POST', body: form });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el parqueo');
    }
  }

  async function remove(id: number) {
    try {
      await api(`/parqueos/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <SectionCard title="Parqueos">
        {error && <div className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="pb-3 pr-4">Nombre</th>
                <th className="pb-3 pr-4">Ubicacion</th>
                <th className="pb-3 pr-4">Tipo</th>
                <th className="pb-3 pr-4">Plazas</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {parqueos.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2.5 pr-4 font-medium">{p.nombre}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{p.ubicacion}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{p.tipo}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{p._count?.plazas ?? 0}</td>
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

      <SectionCard title="Nuevo parqueo">
        <form action={onSubmit} className="space-y-3">
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" required />
          <input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} placeholder="Ubicacion" required />
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Crear parqueo</button>
        </form>
      </SectionCard>
    </div>
  );
}
