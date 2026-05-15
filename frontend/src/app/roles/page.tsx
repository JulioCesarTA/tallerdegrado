'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Permission, Role } from '@/lib/types';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [form, setForm] = useState({ name: '', permissionIds: [] as string[] });

  async function load() {
    const [rolesData, permsData] = await Promise.all([
      api<Role[]>('/roles'),
      api<Permission[]>('/permissions'),
    ]);
    setRoles(rolesData);
    setPermissions(permsData);
  }

  useEffect(() => { load(); }, []);

  async function onSubmit() {
    await api('/roles', { method: 'POST', body: form });
    setForm({ name: '', permissionIds: [] });
    load();
  }

  function togglePerm(id: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      permissionIds: checked ? [...f.permissionIds, id] : f.permissionIds.filter((x) => x !== id),
    }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard title="Roles">
        <div className="space-y-3">
          {roles.map((role) => (
            <article key={role.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{role.name}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {role.permissions.length} permisos
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {role.permissions.map((item) => (
                  <span key={item.permission.id} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    {item.permission.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Nuevo rol">
        <form action={onSubmit} className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" required />
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {permissions.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={form.permissionIds.includes(p.id)}
                  onChange={(e) => togglePerm(p.id, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{p.name}</span>
              </label>
            ))}
          </div>
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Guardar</button>
        </form>
      </SectionCard>
    </div>
  );
}
