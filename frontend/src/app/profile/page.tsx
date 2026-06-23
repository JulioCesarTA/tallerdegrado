'use client';

import { useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { getStoredUser, setSession } from '@/lib/auth';

type SessionResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions?: string[];
  };
};

export default function ProfilePage() {
  const storedUser = getStoredUser();
  const [name, setName] = useState(storedUser?.name ?? '');
  const [email, setEmail] = useState(storedUser?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const body: Record<string, string> = { name, email };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const session = await api<SessionResponse>('/auth/me', { method: 'PATCH', body });
      setSession(session.accessToken, session.user);
      setCurrentPassword('');
      setNewPassword('');
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
      <SectionCard title="Mi perfil" description="Actualiza tus datos personales y tu contrasena">
        {error && <div className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {success && <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

        <form action={onSubmit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" required />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" required />

          <hr className="my-2 border-slate-100" />
          <p className="text-xs font-medium text-slate-500">Cambiar contrasena (opcional)</p>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Contrasena actual"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contrasena"
          />

          <button disabled={loading} className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
