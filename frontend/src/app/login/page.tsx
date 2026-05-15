'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';

type SessionResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleName?: string;
    permissions?: string[];
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setLoading(true);
    setMessage('');
    try {
      const session = await api<SessionResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      });
      setSession(session.accessToken, session.user);
      router.replace('/dashboard');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-8 shadow-2xl">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-500">UAGRM</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Control Vehicular</h1>
        </div>

        <form action={onLogin} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            type="email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contrasena"
            required
          />
          <button
            disabled={loading}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white"
          >
            {loading ? 'Procesando...' : 'Entrar'}
          </button>
        </form>

        {message && (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>
        )}
      </div>
    </div>
  );
}
