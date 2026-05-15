'use client';

import { useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';

type BackupResult = { fileName: string; url: string; generatedAt: string };

export default function BackupsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BackupResult | null>(null);
  const [error, setError] = useState('');

  async function generateBackup() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api<BackupResult>('/backups/generate', { method: 'POST' });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar backup');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="Backup del sistema"
      actions={
        <button onClick={generateBackup} disabled={loading} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50">
          {loading ? 'Generando...' : 'Generar backup'}
        </button>
      }
    >
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
          <p className="font-medium text-emerald-800">Backup generado</p>
          <p className="text-sm text-slate-600">{result.fileName}</p>
          <p className="text-xs text-slate-400">{new Date(result.generatedAt).toLocaleString()}</p>
          {result.url && (
            <a href={result.url} target="_blank" rel="noreferrer" className="inline-block text-sm text-emerald-700 underline">
              Descargar
            </a>
          )}
        </div>
      )}
      {!result && !error && (
        <p className="text-sm text-slate-500">Genera un backup para exportar todos los datos del sistema.</p>
      )}
    </SectionCard>
  );
}
