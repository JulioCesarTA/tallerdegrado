'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Camara, PuntoAcceso, Usuario } from '@/lib/types';

const emptyForm = {
  nombre: '',
  ubicacion: '',
  camaraIngresoId: 0,
  camaraSalidaId: 0,
  usuarioId: 0,
};

export default function AccessPointsPage() {
  const [accessPoints, setAccessPoints] = useState<PuntoAcceso[]>([]);
  const [camaras, setCamaras]           = useState<Camara[]>([]);
  const [usuarios, setUsuarios]         = useState<Usuario[]>([]);
  const [form, setForm]                 = useState(emptyForm);
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [error, setError]               = useState('');

  async function loadData() {
    try {
      const [aps, cams, users] = await Promise.all([
        api<PuntoAcceso[]>('/access-points'),
        api<Camara[]>('/cameras'),
        api<Usuario[]>('/users'),
      ]);
      setAccessPoints(aps);
      setCamaras(cams);
      setUsuarios(users);
      if (!form.camaraIngresoId && cams.length) {
        setForm((f) => ({
          ...f,
          camaraIngresoId: cams[0].id,
          camaraSalidaId: cams[0].id,
          usuarioId: users[0]?.id ?? 0,
        }));
      }
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
      camaraIngresoId: ap.camaraIngresoId,
      camaraSalidaId: ap.camaraSalidaId,
      usuarioId: ap.usuarioId,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      camaraIngresoId: camaras[0]?.id ?? 0,
      camaraSalidaId: camaras[0]?.id ?? 0,
      usuarioId: usuarios[0]?.id ?? 0,
    });
  }

  async function onSubmit() {
    try {
      if (editingId !== null) {
        await api(`/access-points/${editingId}`, { method: 'PATCH', body: form });
        setEditingId(null);
      } else {
        await api('/access-points', { method: 'POST', body: form });
      }
      setForm({
        ...emptyForm,
        camaraIngresoId: camaras[0]?.id ?? 0,
        camaraSalidaId: camaras[0]?.id ?? 0,
        usuarioId: usuarios[0]?.id ?? 0,
      });
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
      <SectionCard title="Puntos de acceso">
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
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-slate-500">
                    Ingreso: <span className="text-slate-700">{ap.camaraIngreso?.nombre ?? ap.camaraIngresoId}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Salida: <span className="text-slate-700">{ap.camaraSalida?.nombre ?? ap.camaraSalidaId}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Usuario: <span className="text-slate-700">{ap.usuario?.nombre ?? ap.usuarioId}</span>
                  </p>
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
          <div>
            <label className="block text-xs text-slate-500 mb-1">Camara de ingreso</label>
            <select
              value={form.camaraIngresoId}
              onChange={(e) => setForm({ ...form, camaraIngresoId: Number(e.target.value) })}
            >
              {camaras.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Camara de salida</label>
            <select
              value={form.camaraSalidaId}
              onChange={(e) => setForm({ ...form, camaraSalidaId: Number(e.target.value) })}
            >
              {camaras.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Usuario asignado</label>
            <select
              value={form.usuarioId}
              onChange={(e) => setForm({ ...form, usuarioId: Number(e.target.value) })}
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
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
