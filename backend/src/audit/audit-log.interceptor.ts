import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuthUser } from '../common/types/auth-user.type';
import { AuditService } from './audit.service';

const MODULE_LABELS: Record<string, string> = {
  users: 'Usuarios',
  roles: 'Roles',
  permissions: 'Permisos',
  cameras: 'Camaras',
  'access-points': 'Puntos de acceso',
  vehicles: 'Vehiculos',
  sanctions: 'Sanciones',
  'sanction-definitions': 'Tipos de sancion',
  alerts: 'Alertas',
  backups: 'Backups',
  detections: 'Detecciones',
};

const ACTION_LABELS: Record<string, string> = {
  POST: 'Crear',
  PATCH: 'Actualizar',
  PUT: 'Actualizar',
  DELETE: 'Eliminar',
};

const SKIPPED_SEGMENTS = new Set(['auth', 'audit-logs']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      user?: AuthUser;
    }>();

    const accion = ACTION_LABELS[request.method];
    const segment = request.url.split('/').filter(Boolean)[1]?.split('?')[0];

    if (!accion || !segment || SKIPPED_SEGMENTS.has(segment)) {
      return next.handle();
    }

    const modulo = MODULE_LABELS[segment] ?? segment;
    const usuarioId = request.user?.sub ?? null;

    return next.handle().pipe(
      tap(() => {
        void this.auditService.log(usuarioId, accion, modulo, `${request.method} ${request.url}`);
      }),
    );
  }
}
