export const SYSTEM_PERMISSIONS = [
  'Ver dashboard',
  'Gestionar usuarios',
  'Gestionar roles',
  'Gestionar permisos',
  'Gestionar camaras',
  'Gestionar eventos',
  'Procesar detecciones',
  'Gestionar vehiculos',
  'Ver historial vehicular',
  'Gestionar sanciones',
  'Gestionar alertas',
  'Ver reportes',
  'Generar backups',
] as const;

export const DEFAULT_ROLES = [
  {
    name: 'Administrador',
    permissions: [...SYSTEM_PERMISSIONS],
  },
  {
    name: 'Operador',
    permissions: [
      'Ver dashboard',
      'Gestionar camaras',
      'Gestionar eventos',
      'Procesar detecciones',
      'Gestionar vehiculos',
      'Ver historial vehicular',
      'Gestionar alertas',
      'Ver reportes',
    ],
  },
  {
    name: 'Seguridad',
    permissions: [
      'Ver dashboard',
      'Gestionar eventos',
      'Procesar detecciones',
      'Ver historial vehicular',
      'Gestionar sanciones',
      'Gestionar alertas',
      'Ver reportes',
    ],
  },
] as const;
