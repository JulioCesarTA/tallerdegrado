'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Camara } from '@/lib/types';

const emptyForm = { nombre: '', ubicacion: '', tipoCamara: '', estado: '' };

export default function CamerasPage() {
  const [cameras, setCameras]           = useState<Camara[]>([]);
  const [tipos, setTipos]               = useState<string[]>([]);
  const [estados, setEstados]           = useState<string[]>([]);
  const [form, setForm]                 = useState(emptyForm);
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [error, setError]               = useState('');

  async function loadData() {
    try {
      const [cams, ts, es] = await Promise.all([
        api<Camara[]>('/cameras'),
        api<string[]>('/cameras/types'),
        api<string[]>('/cameras/statuses'),
      ]);
      setCameras(cams);
      setTipos(ts);
      setEstados(es);
      setForm((f) => ({
        ...f,
        tipoCamara: f.tipoCamara || ts[0] || '',
        estado: f.estado || es[0] || '',
      }));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar camaras');
    }
  }

  useEffect(() => { loadData(); }, []);

  function startEdit(cam: Camara) {
    setEditingId(cam.id);
    setForm({
      nombre: cam.nombre,
      ubicacion: cam.ubicacion,
      tipoCamara: cam.tipoCamara,
      estado: cam.estado,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm, tipoCamara: tipos[0] ?? '', estado: estados[0] ?? '' });
  }

  async function onSubmit() {
    setError('');
    try {
      if (editingId !== null) {
        await api(`/cameras/${editingId}`, { method: 'PATCH', body: form });
        setEditingId(null);
      } else {
        await api('/cameras', { method: 'POST', body: form });
      }
      setForm({ ...emptyForm, tipoCamara: tipos[0] ?? '', estado: estados[0] ?? '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la camara');
    }
  }

  async function remove(id: number) {
    try {
      await api(`/cameras/${id}`, { method: 'DELETE' });
      if (editingId === id) cancelEdit();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la camara');
    }
  }

  const estadoColor: Record<string, string> = {
    activa:        'bg-emerald-100 text-emerald-700',
    inactiva:      'bg-slate-100 text-slate-500',
    falla:         'bg-rose-100 text-rose-700',
    mantenimiento: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard title="Camaras">
        {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {cameras.length === 0 && !error && (
          <p className="text-sm text-slate-400">Sin camaras registradas.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {cameras.map((cam) => (
            <article
              key={cam.id}
              className={`rounded-2xl border p-4 transition-colors ${editingId === cam.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{cam.nombre}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{cam.ubicacion}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => editingId === cam.id ? cancelEdit() : startEdit(cam)}
                    className={`text-xs font-medium ${editingId === cam.id ? 'text-slate-400 hover:text-slate-600' : 'text-emerald-600 hover:text-emerald-800'}`}
                  >
                    {editingId === cam.id ? 'Cancelar' : 'Editar'}
                  </button>
                  <button
                    onClick={() => remove(cam.id)}
                    className="text-xs font-medium text-rose-500 hover:text-rose-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs capitalize text-slate-600">
                  {cam.tipoCamara}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${estadoColor[cam.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                  {cam.estado}
                </span>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={editingId !== null ? 'Editar camara' : 'Nueva camara'}>
        <form action={onSubmit} className="space-y-3">
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre"
            required
          />
          <input
            value={form.ubicacion}
            onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            placeholder="Ubicacion"
            required
          />
          <div>
            <label className="mb-1 block text-xs text-slate-500">Tipo de camara</label>
            <select
              value={form.tipoCamara}
              onChange={(e) => setForm({ ...form, tipoCamara: e.target.value })}
            >
              {tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {estados.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-2">
            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
            <button className={`rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white ${editingId !== null ? 'flex-1' : 'w-full'}`}>
              {editingId !== null ? 'Guardar cambios' : 'Guardar'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
