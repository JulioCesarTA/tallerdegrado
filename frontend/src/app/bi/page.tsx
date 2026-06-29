'use client';

import { SectionCard } from '@/components/section-card';

const METABASE_URL = process.env.NEXT_PUBLIC_METABASE_URL ?? 'http://localhost:3010';
const DASHBOARD_URL = process.env.NEXT_PUBLIC_METABASE_DASHBOARD_URL ?? '';

export default function BiPage() {
  if (DASHBOARD_URL) {
    // Recortamos ~55px de la base para ocultar el sello "Con tecnologia de Metabase"
    return (
      <div className="w-full overflow-hidden rounded-xl" style={{ height: '85vh' }}>
        <iframe
          src={`${DASHBOARD_URL}#refresh=60`}
          title="Dashboard BI"
          className="w-full border-0"
          style={{ height: 'calc(85vh + 55px)' }}
          allowTransparency
        />
      </div>
    );
  }

  return (
    <SectionCard title="Reportes BI (Metabase)">
      <p className="mb-4 text-sm text-slate-600">
        Metabase está corriendo en{' '}
        <a href={METABASE_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-600 underline">
          {METABASE_URL}
        </a>
        . Configurá el dashboard una sola vez y pegá su URL pública para verlo embebido acá.
      </p>

      <ol className="mb-5 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>Abrí <strong>{METABASE_URL}</strong> y creá la cuenta de administrador.</li>
        <li>Conectá tu base: tipo <strong>PostgreSQL</strong>, host <code>host.docker.internal</code>, puerto <code>5432</code>, base <code>control_vehicular</code> (usuario/clave de <code>backend/.env</code>).</li>
        <li>Creá un <strong>Dashboard</strong> con las vistas <code>mv_accesos_diarios</code>, <code>mv_top_vehiculos</code>, <code>mv_accesos_franja</code>, etc.</li>
        <li>En el dashboard: <strong>Compartir → Public link</strong> (Admin &gt; Settings &gt; Public sharing habilitado).</li>
        <li>Pegá esa URL en <code>NEXT_PUBLIC_METABASE_DASHBOARD_URL</code> dentro de <code>frontend/.env.local</code> y recargá.</li>
      </ol>

      <a
        href={METABASE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
      >
        Abrir Metabase
      </a>
    </SectionCard>
  );
}
