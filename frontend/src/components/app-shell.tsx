'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { clearSession, getStoredUser, getToken } from '@/lib/auth';

const links = [
  { href: '/dashboard',       label: 'Dashboard'       },
  { href: '/users',           label: 'Usuarios'        },
  { href: '/roles',           label: 'Roles'           },
  { href: '/permissions',     label: 'Permisos'        },
  { href: '/cameras',         label: 'Camaras'         },
  { href: '/access-points',   label: 'Puntos de acceso' },
  { href: '/detections',      label: 'Detecciones'     },
  { href: '/events',          label: 'Historial'       },
  { href: '/sanctions',       label: 'Sanciones'       },
  { href: '/assign-sanction', label: 'Asignar sancion' },
  { href: '/alerts',          label: 'Alertas'         },
  { href: '/reports',         label: 'Reportes'        },
  { href: '/backups',         label: 'Backups'         },
];

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: '#34d399', textTransform: 'uppercase' }}>UAGRM</p>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '2px', lineHeight: 1.3 }}>Control Vehicular</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
  
              style={{
                display: 'block',
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '2px',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                color: active ? '#ffffff' : '#cbd5e1',
                background: active ? '#10b981' : 'transparent',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}
          >
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/stream');

  const pageTitle = links.find((l) => pathname.startsWith(l.href))?.label ?? 'Sistema';

  if (!isPublic && !getToken()) {
    router.replace('/login');
    return null;
  }

  if (isPublic) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block flex-shrink-0"
        style={{ width: 220, background: '#0f172a', minHeight: '100vh' }}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900">{pageTitle}</h2>
        </header>

        <main className="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
