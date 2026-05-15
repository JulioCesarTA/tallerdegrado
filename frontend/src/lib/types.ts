export type Permission = {
  id: number;
  name: string;
};

export type Role = {
  id: number;
  name: string;
  permissions: Array<{ permission: Permission }>;
};

export type User = {
  id: number;
  name: string;
  email: string;
  roleId: number;
  role: { id: number; name: string };
};

export type CameraType = {
  id: number;
  name: string;
};

export type CameraStatus = {
  id: number;
  name: string;
};

export type Camera = {
  id: number;
  name: string;
  location: string;
  cameraTypeId: number;
  cameraStatusId: number;
  streamLink?: string | null;
  cameraType?: CameraType | null;
  cameraStatus?: CameraStatus | null;
};

export type TipoVehiculo = {
  id: number;
  name: string;
};

export type AccessLog = {
  id: number;
  vehicleId: number;
  accessPointId?: number | null;
  ingresoCameraId?: number | null;
  salidaCameraId?: number | null;
  ingresoAt: string;
  egresoAt?: string | null;
  evidenceUrl?: string | null;
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model' | 'color'>;
  ingresoCamera?: { id: number; name: string } | null;
  salidaCamera?: { id: number; name: string } | null;
};

export type Vehicle = {
  id: number;
  plate: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  tipoVehiculoId?: number | null;
  tipoVehiculo?: TipoVehiculo | null;
  sanctions?: Sanction[];
  accessLogs?: AccessLog[];
};

export type SanctionDefinition = {
  id: number;
  name: string;
  reason: string;
  durationDays: number | null;
};

export type Sanction = {
  id: number;
  vehicleId: number;
  sanctionDefinitionId: number;
  startsAt: string;
  endsAt?: string | null;
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>;
  definition?: { id: number; name: string; reason: string; durationDays: number | null };
};

export type AlertType = {
  id: number;
  name: string;
};

export type Alert = {
  id: number;
  alertTypeId: number;
  createdAt: string;
  alertType?: AlertType | null;
  camera?: { id: number; name: string } | null;
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
  recentAccess: AccessLog[];
  recentAlerts: Alert[];
};

export type ReportsOverview = {
  totals: {
    totalVehicles: number;
    totalCameras: number;
    activeSanctions: number;
    totalAlerts: number;
  };
  accessByDay: { day: string; ingresos: number; salidas: number }[];
  alertsByType: { type: string; count: number }[];
  topVehicles: { plate: string; count: number }[];
};

export type DetectionResult = {
  plate: string;
  confidence: number;
  brand: string;
  model: string;
  color: string;
  damageDetails: string;
  summary: string;
  evidenceUrl: string;
  vehicle: Vehicle;
  sanctioned: boolean;
};
