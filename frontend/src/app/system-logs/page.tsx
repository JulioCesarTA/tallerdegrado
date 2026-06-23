'use client';

import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/section-card';
import { api } from '@/lib/api';
import { LogSistema } from '@/lib/types';

const ACTION_COLORS: Record<string, string> = {
  Crear: 'bg-emerald-50 text-emerald-700',
  Actualizar: 'bg-amber-50 text-amber-700',
  Eliminar: 'bg-rose-50 text-rose-700',
  'Inicio de sesion': 'bg-sky-50 text-sky-700',
};

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api<LogSistema[]>('/audit-logs');
      setLogs(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los logs');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <SectionCard title="Logs del sistema" description="Registro de acciones realizadas por cada usuario">
      {error && <div className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 uppercase">
            <tr>
              <th className="pb-3 pr-4">Fecha</th>
              <th className="pb-3 pr-4">Usuario</th>
              <th className="pb-3 pr-4">Accion</th>
              <th className="pb-3 pr-4">Modulo</th>
              <th className="pb-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="py-2.5 pr-4 whitespace-nowrap text-slate-600">
                  {new Date(log.fecha).toLocaleString()}
                </td>
                <td className="py-2.5 pr-4 font-medium">
                  {log.usuario ? log.usuario.nombre : 'Sistema'}
                </td>
                <td className="py-2.5 pr-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ACTION_COLORS[log.accion] ?? 'bg-slate-100 text-slate-700'}`}>
                    {log.accion}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-slate-700">{log.modulo}</td>
                <td className="py-2.5 text-slate-500">{log.detalle ?? '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Sin registros todavia
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
