'use client';

import { getStoredUser } from '@/lib/auth';

export default function DashboardPage() {
  const user = getStoredUser();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">
          Sistema de Control Vehicular — UAGRM
        </p>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Bienvenido, {user?.name ?? 'usuario'}
        </h1>
        <p className="text-slate-500 text-base leading-relaxed">
          Desde aquí podés gestionar el ingreso y salida de vehículos, administrar cámaras,
          consultar el historial de accesos y controlar sanciones activas.
        </p>
        <p className="mt-4 text-slate-400 text-sm">
          Usá el menú lateral para navegar entre los módulos del sistema.
        </p>
      </div>
    </div>
  );
}
