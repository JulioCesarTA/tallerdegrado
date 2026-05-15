'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Permission } from '@/lib/types';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [form, setForm] = useState({ name: '' });

  async function load() {
    setPermissions(await api<Permission[]>('/permissions'));
  }

  useEffect(() => { load(); }, []);

  async function onSubmit() {
    await api('/permissions', { method: 'POST', body: form });
    setForm({ name: '' });
    load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard title="Permisos">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="pb-3">Nombre</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2.5">{p.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Nuevo permiso">
        <form action={onSubmit} className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" required />
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Guardar</button>
        </form>
      </SectionCard>
    </div>
  );
}
