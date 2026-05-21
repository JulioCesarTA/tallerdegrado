'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { Rol, Usuario } from '@/lib/types';

const emptyForm = { name: '', email: '', password: '', roleId: 0 };

export default function UsersPage() {
  const [users, setUsers]   = useState<Usuario[]>([]);
  const [roles, setRoles]   = useState<Rol[]>([]);
  const [form, setForm]     = useState(emptyForm);
  const [error, setError]   = useState('');

  async function load() {
    try {
      const [usersData, rolesData] = await Promise.all([
        api<Usuario[]>('/users'),
        api<Rol[]>('/roles'),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setForm((f) => ({ ...f, roleId: f.roleId || rolesData[0]?.id || 0 }));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }

  useEffect(() => { load(); }, []);

  async function onSubmit() {
    try {
      await api('/users', { method: 'POST', body: form });
      setForm({ ...emptyForm, roleId: roles[0]?.id || 0 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario');
    }
  }

  async function remove(id: number) {
    try {
      await api(`/users/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <SectionCard title="Usuarios">
        {error && <div className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="pb-3 pr-4">Nombre</th>
                <th className="pb-3 pr-4">Correo</th>
                <th className="pb-3 pr-4">Rol</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-2.5 pr-4 font-medium">{u.nombre}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{u.correo}</td>
                  <td className="py-2.5 pr-4">{u.rol?.nombre}</td>
                  <td className="py-2.5">
                    <button onClick={() => remove(u.id)} className="text-xs text-rose-500 hover:text-rose-700">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Nuevo usuario">
        <form action={onSubmit} className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" required />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Correo" required />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contrasena" required />
          <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Crear usuario</button>
        </form>
      </SectionCard>
    </div>
  );
}
