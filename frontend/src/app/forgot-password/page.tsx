'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api('/auth/forgot-password', { method: 'POST', auth: false, body: { email } });
      setMessage('Si el correo esta registrado, te enviamos un codigo. Revisa tu bandeja.');
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el codigo');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setLoading(true);
    setError('');
    try {
      await api('/auth/reset-password', { method: 'POST', auth: false, body: { email, code, newPassword } });
      setMessage('Contrasena actualizada. Redirigiendo al login...');
      setTimeout(() => router.replace('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contrasena');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-8 shadow-2xl">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-500">UAGRM</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Recuperar contrasena</h1>
        </div>

        {step === 1 ? (
          <form action={requestCode} className="space-y-3">
            <p className="text-sm text-slate-600">Ingresa tu correo y te enviaremos un codigo de verificacion.</p>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" type="email" required />
            <button disabled={loading} className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white">
              {loading ? 'Enviando...' : 'Enviar codigo'}
            </button>
          </form>
        ) : (
          <form action={resetPassword} className="space-y-3">
            <p className="text-sm text-slate-600">Ingresa el codigo de 6 digitos que recibiste y tu nueva contrasena.</p>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Codigo de 6 digitos" maxLength={6} required />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contrasena" minLength={6} required />
            <button disabled={loading} className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white">
              {loading ? 'Procesando...' : 'Cambiar contrasena'}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-slate-500 hover:text-slate-700">
              Volver a enviar el codigo
            </button>
          </form>
        )}

        {message && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <Link href="/login" className="block text-center text-sm text-slate-500 hover:text-slate-700">
          Volver al inicio de sesion
        </Link>
      </div>
    </div>
  );
}
