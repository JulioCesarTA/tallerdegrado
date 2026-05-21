export type Permiso = {
  id: number;
  nombre: string;
};

export type Rol = {
  id: number;
  nombre: string;
  permisos: Array<{ permiso: Permiso }>;
};

export type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  rolId: number;
  rol: { id: number; nombre: string };
  camaraIngresoId?: number | null;
  camaraSalidaId?: number | null;
  camaraIngreso?: Camara | null;
  camaraSalida?: Camara | null;
};

export type TipoCamara = {
  id: number;
  nombre: string;
};

export type EstadoCamara = {
  id: number;
  nombre: string;
};

export type Camara = {
  id: number;
  nombre: string;
  ubicacion: string;
  tipoCamaraId: number;
  estadoCamaraId: number;
  tipoCamara?: TipoCamara | null;
  estadoCamara?: EstadoCamara | null;
};

export type TipoVehiculo = {
  id: number;
  nombre: string;
};

export type RegistroAcceso = {
  id: number;
  vehiculoId: number;
  puntoAccesoIngresoId?: number | null;
  puntoAccesoEgresoId?: number | null;
  horaIngreso: string;
  horaSalida?: string | null;
  fecha: string;
  urlEvidencia?: string | null;
  estado: 'ingreso' | 'salida' | 'denegado';
  vehiculo?: Pick<Vehiculo, 'id' | 'placa' | 'marca' | 'modelo' | 'color'>;
  puntoAccesoIngreso?: { id: number; nombre: string } | null;
  puntoAccesoEgreso?: { id: number; nombre: string } | null;
};

export type Vehiculo = {
  id: number;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  color?: string | null;
  caracteristicas?: string | null;
  tipoVehiculoId?: number | null;
  tipoVehiculo?: TipoVehiculo | null;
  sanciones?: Sancion[];
  registrosAcceso?: RegistroAcceso[];
};

export type TipoSancion = {
  id: number;
  nombre: string;
  motivo: string;
  duracionDias: number | null;
};

export type Sancion = {
  id: number;
  vehiculoId: number;
  tipoSancionId: number;
  fechaInicio: string;
  fechaFin?: string | null;
  vehiculo?: Pick<Vehiculo, 'id' | 'placa' | 'marca' | 'modelo'>;
  tipoSancion?: { id: number; nombre: string; motivo: string; duracionDias: number | null };
};

export type TipoAlerta = {
  id: number;
  nombre: string;
};

export type EstadoAlerta = {
  id: number;
  nombre: string;
};

export type Alerta = {
  id: number;
  tipoAlertaId: number;
  estadoAlertaId: number;
  creadoEn: string;
  tipoAlerta?: TipoAlerta | null;
  estadoAlerta?: EstadoAlerta | null;
  camara?: { id: number; nombre: string } | null;
};

export type DashboardSummary = {
  totals: {
    totalVehicles: number;
    totalCameras: number;
    totalAlerts: number;
    activeSanctions: number;
    ingresos: number;
    salidas: number;
  };
  recentAccess: RegistroAcceso[];
  recentAlerts: Alerta[];
};

export type ReportsOverview = {
  totals: {
    totalVehiculos: number;
    totalCamaras: number;
    sancionesActivas: number;
    totalAlertas: number;
  };
  vehiculosAdentro: number;
  vehiculosRechazados: number;
  vehiculosSalidos: number;
  sancionadosHoy: number;
  alertasPorEstado: { pendiente: number; resuelto: number; mantenimiento: number };
  accessByDay: { day: string; ingresos: number; salidas: number; rechazados: number }[];
  alertsByType: { type: string; count: number }[];
  topVehicles: { plate: string; count: number }[];
  porPuntoAcceso: { nombre: string; ingresos: number; salidas: number }[];
};

export type PuntoAcceso = {
  id: number;
  nombre: string;
  ubicacion: string;
  camaraIngresoId: number;
  camaraSalidaId: number;
  usuarioId: number;
  camaraIngreso?: Camara | null;
  camaraSalida?: Camara | null;
  usuario?: { id: number; nombre: string; correo: string } | null;
};

export type DetectionResult = {
  plate: string;
  confidence: number;
  marca: string;
  modelo: string;
  color: string;
  caracteristicas: string;
  evidenceUrl: string;
  vehicle: Vehiculo;
  sanctioned: boolean;
};
