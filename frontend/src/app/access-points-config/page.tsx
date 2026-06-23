'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Camara, PuntoAcceso, Usuario } from '@/lib/types';

export default function AccessPointsConfigPage() {
  const [accessPoints, setAccessPoints] = useState<PuntoAcceso[]>([]);
  const [camaras, setCamaras]           = useState<Camara[]>([]);
  const [usuarios, setUsuarios]         = useState<Usuario[]>([]);
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [form, setForm]                 = useState({ camaraIngresoId: 0, camaraSalidaId: 0, usuarioId: 0 });
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');

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
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos');
    }
  }

  useEffect(() => { loadData(); }, []);

  function selectAccessPoint(ap: PuntoAcceso) {
    setSelectedId(ap.id);
    setSuccess('');
    setForm({
      camaraIngresoId: ap.camaraIngresoId ?? camaras[0]?.id ?? 0,
      camaraSalidaId: ap.camaraSalidaId ?? camaras[0]?.id ?? 0,
      usuarioId: ap.usuarioId ?? usuarios[0]?.id ?? 0,
    });
  }

  async function onSubmit() {
    if (selectedId === null) return;
    setError('');
    setSuccess('');
    try {
      await api(`/access-points/${selectedId}`, { method: 'PATCH', body: form });
      setSuccess('Configuracion guardada correctamente');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la configuracion');
    }
  }

  const selected = accessPoints.find((ap) => ap.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <SectionCard title="Puntos de acceso" description="Selecciona un punto de acceso para configurarlo">
        {error && !selected && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {accessPoints.length === 0 ? (
          <p className="text-sm text-slate-400">No hay puntos de acceso registrados.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {accessPoints.map((ap) => (
              <button
                key={ap.id}
                onClick={() => selectAccessPoint(ap)}
                className={`text-left rounded-2xl border p-4 transition-colors ${selectedId === ap.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <p className="font-medium truncate">{ap.nombre}</p>
                <p className="text-xs text-slate-500 truncate">{ap.ubicacion}</p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-slate-500">
                    Ingreso: <span className="text-slate-700">{ap.camaraIngreso?.nombre ?? 'Sin asignar'}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Salida: <span className="text-slate-700">{ap.camaraSalida?.nombre ?? 'Sin asignar'}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Personal: <span className="text-slate-700">{ap.usuario?.nombre ?? 'Sin asignar'}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={selected ? `Configurar: ${selected.nombre}` : 'Configurar punto de acceso'}
        description="Asigna las camaras y el personal de seguridad"
      >
        {!selected ? (
          <p className="text-sm text-slate-400">Selecciona un punto de acceso de la lista.</p>
        ) : (
          <>
            {error && <div className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
            {success && <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}
            <form action={onSubmit} className="space-y-3">
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
                <label className="block text-xs text-slate-500 mb-1">Personal de seguridad</label>
                <select
                  value={form.usuarioId}
                  onChange={(e) => setForm({ ...form, usuarioId: Number(e.target.value) })}
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
              <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
                Guardar configuracion
              </button>
            </form>
          </>
        )}
      </SectionCard>
    </div>
  );
}
