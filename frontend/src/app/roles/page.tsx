'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Permiso, Rol } from '@/lib/types';

export default function RolesPage() {
  const [roles, setRoles]             = useState<Rol[]>([]);
  const [permissions, setPermissions] = useState<Permiso[]>([]);
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [name, setName]               = useState('');
  const [permissionIds, setPermissionIds] = useState<number[]>([]);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  async function load() {
    const [rolesData, permsData] = await Promise.all([
      api<Rol[]>('/roles'),
      api<Permiso[]>('/permissions'),
    ]);
    setRoles(rolesData);
    setPermissions(permsData);
  }

  useEffect(() => { load(); }, []);

  function selectRole(rol: Rol) {
    setSelectedId(rol.id);
    setName(rol.nombre);
    setPermissionIds(rol.permisos.map((item) => item.permiso.id));
    setError(''); setSuccess('');
  }

  function togglePerm(id: number, checked: boolean) {
    setPermissionIds((ids) => (checked ? [...ids, id] : ids.filter((x) => x !== id)));
  }

  async function onSubmit() {
    if (selectedId === null) return;
    setError(''); setSuccess('');
    try {
      await api(`/roles/${selectedId}`, { method: 'PATCH', body: { name } });
      await api(`/roles/${selectedId}/permissions`, { method: 'PATCH', body: { permissionIds } });
      setSuccess('Rol actualizado correctamente');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el rol');
    }
  }

  async function onDelete() {
    if (selectedId === null) return;
    if (!confirm('¿Eliminar este rol?')) return;
    setError(''); setSuccess('');
    try {
      await api(`/roles/${selectedId}`, { method: 'DELETE' });
      setSelectedId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el rol');
    }
  }

  const selected = roles.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard title="Roles">
        <div className="space-y-3">
          {roles.map((rol) => (
            <button
              key={rol.id}
              onClick={() => selectRole(rol)}
              className={`block w-full text-left rounded-2xl border p-4 transition-colors ${selectedId === rol.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{rol.nombre}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {rol.permisos?.length ?? 0} permisos
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rol.permisos?.map((item) => (
                  <span key={item.permiso.id} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    {item.permiso.nombre}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={selected ? `Editar: ${selected.nombre}` : 'Editar rol'}>
        {!selected ? (
          <p className="text-sm text-slate-400">Selecciona un rol de la lista.</p>
        ) : (
          <form action={onSubmit} className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" required />
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {permissions.map((p) => (
                <label key={p.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={permissionIds.includes(p.id)}
                    onChange={(e) => togglePerm(p.id, e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{p.nombre}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Guardar</button>
            <button type="button" onClick={onDelete} className="w-full rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100">
              Eliminar rol
            </button>
          </form>
        )}
      </SectionCard>
    </div>
  );
}
