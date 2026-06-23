'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { PuntoAcceso } from '@/lib/types';

const ESTADOS = ['activo', 'inactivo', 'mantenimiento'];

const emptyForm = { nombre: '', ubicacion: '', descripcion: '', estado: ESTADOS[0] };

export default function AccessPointsPage() {
  const [accessPoints, setAccessPoints] = useState<PuntoAcceso[]>([]);
  const [form, setForm]                 = useState(emptyForm);
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [error, setError]               = useState('');

  async function loadData() {
    try {
      const aps = await api<PuntoAcceso[]>('/access-points');
      setAccessPoints(aps);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos');
    }
  }

  useEffect(() => { loadData(); }, []);

  function startEdit(ap: PuntoAcceso) {
    setEditingId(ap.id);
    setForm({
      nombre: ap.nombre,
      ubicacion: ap.ubicacion,
      descripcion: ap.descripcion ?? '',
      estado: ap.estado,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit() {
    try {
      if (editingId !== null) {
        await api(`/access-points/${editingId}`, { method: 'PATCH', body: form });
        setEditingId(null);
      } else {
        await api('/access-points', { method: 'POST', body: form });
      }
      setForm(emptyForm);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el punto de acceso');
    }
  }

  async function remove(id: number) {
    try {
      await api(`/access-points/${id}`, { method: 'DELETE' });
      if (editingId === id) cancelEdit();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard title="Puntos de acceso" description="Alta, edicion y eliminacion de puntos de acceso">
        {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {accessPoints.length === 0 ? (
          <p className="text-sm text-slate-400">No hay puntos de acceso registrados.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {accessPoints.map((ap) => (
              <article
                key={ap.id}
                className={`rounded-2xl border p-4 transition-colors ${editingId === ap.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ap.nombre}</p>
                    <p className="text-xs text-slate-500 truncate">{ap.ubicacion}</p>
                    {ap.descripcion && <p className="text-xs text-slate-400 truncate mt-0.5">{ap.descripcion}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => editingId === ap.id ? cancelEdit() : startEdit(ap)}
                      className={`text-xs ${editingId === ap.id ? 'text-slate-400 hover:text-slate-600' : 'text-emerald-600 hover:text-emerald-800'}`}
                    >
                      {editingId === ap.id ? 'Cancelar' : 'Editar'}
                    </button>
                    <button
                      onClick={() => remove(ap.id)}
                      className="text-xs text-rose-500 hover:text-rose-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs capitalize text-slate-600">
                    {ap.estado}
                  </span>
                  <span className="text-xs text-slate-500">
                    {ap.camaraIngresoId || ap.camaraSalidaId || ap.usuarioId
                      ? 'Configurado'
                      : 'Sin configurar (faltan camaras/personal)'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title={editingId !== null ? 'Editar punto de acceso' : 'Nuevo punto de acceso'}>
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
          <input
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripcion (opcional)"
          />
          <div>
            <label className="mb-1 block text-xs text-slate-500">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
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
