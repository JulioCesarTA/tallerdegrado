'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Camera, CameraStatus, CameraType } from '@/lib/types';

const emptyForm = { name: '', location: '', cameraTypeId: 0, cameraStatusId: 0, streamLink: '' };

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cameraTypes, setCameraTypes] = useState<CameraType[]>([]);
  const [cameraStatuses, setCameraStatuses] = useState<CameraStatus[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [cams, types, statuses] = await Promise.all([
        api<Camera[]>('/cameras'),
        api<CameraType[]>('/cameras/types'),
        api<CameraStatus[]>('/cameras/statuses'),
      ]);
      setCameras(cams);
      setCameraTypes(types);
      setCameraStatuses(statuses);
      if (types.length && !form.cameraTypeId) {
        setForm((f) => ({ ...f, cameraTypeId: types[0].id, cameraStatusId: statuses[0]?.id ?? 0 }));
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar camaras');
    }
  }

  useEffect(() => { loadData(); }, []);

  async function onSubmit() {
    try {
      await api('/cameras', { method: 'POST', body: form });
      setForm({ ...emptyForm, cameraTypeId: cameraTypes[0]?.id ?? 0, cameraStatusId: cameraStatuses[0]?.id ?? 0 });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la camara');
    }
  }

  async function remove(id: number) {
    await api(`/cameras/${id}`, { method: 'DELETE' });
    loadData();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard title="Camaras">
        {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          {cameras.map((camera) => (
            <article key={camera.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{camera.name}</p>
                  <p className="text-xs text-slate-500 truncate">{camera.location}</p>
                </div>
                <button
                  onClick={() => remove(camera.id)}
                  className="shrink-0 text-xs text-rose-500 hover:text-rose-700"
                >
                  Eliminar
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <span className="inline-block text-xs capitalize text-emerald-700">
                  {camera.cameraType?.name ?? camera.cameraTypeId}
                </span>
                <span className="inline-block text-xs capitalize text-slate-500">
                  {camera.cameraStatus?.name ?? camera.cameraStatusId}
                </span>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Nueva camara">
        <form action={onSubmit} className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" required />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ubicacion" required />
          <select
            value={form.cameraTypeId}
            onChange={(e) => setForm({ ...form, cameraTypeId: Number(e.target.value) })}
          >
            {cameraTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            value={form.cameraStatusId}
            onChange={(e) => setForm({ ...form, cameraStatusId: Number(e.target.value) })}
          >
            {cameraStatuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            value={form.streamLink}
            onChange={(e) => setForm({ ...form, streamLink: e.target.value })}
            placeholder="Stream link (opcional)"
          />
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Guardar</button>
        </form>
      </SectionCard>
    </div>
  );
}
