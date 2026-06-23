# Relaciones `<<include>>` / `<<extend>>` entre Casos de Uso

Basado en el código real del sistema (backend NestJS + frontend Next.js), no en suposición libre. Cada relación cita el archivo donde se verifica.

## Lista de CU

| Código | Nombre |
|---|---|
| CU01 | Iniciar y Cerrar Sesión |
| CU02 | Gestionar Usuarios |
| CU03 | Asignar Permisos (a un Rol: asignar o remover) |
| CU04 | Gestionar Roles |
| CU05 | Gestionar Cámaras |
| CU06 | Registrar Ingreso Vehicular con OCR |
| CU07 | Registrar Salida Vehicular con OCR |
| CU08 | Analizar Características Vehiculares con IA |
| CU09 | Visualizar Historial de Acceso Vehicular |
| CU10 | Gestionar Sanciones |
| CU11 | Sancionar Vehículo |
| CU12 | Visualizar Transmisión de Cámaras en Tiempo Real |
| CU13 | Notificar Cámara Desconectada |
| CU14 | Visualizar Reportes con BI en Tiempo Real |
| CU15 | Generar Backup |
| CU16 | Configurar Punto de Acceso |
| CU17 | Exportar Reportes |
| CU18 | Actualizar Perfil |
| CU19 | Visualizar Auditoría del Sistema |
| CU20 | Gestionar Puntos de Acceso |
| CU21 | Buscar Vehículo por Placa |

---

## Tabla resumen

| CU base | Relación | CU relacionado | Tipo |
|---|---|---|---|
| CU02–CU21 (todos, salvo CU01) | requiere sesión activa | CU01 | `<<include>>` |
| CU02 | requiere seleccionar un rol existente | CU04 | `<<include>>` |
| CU04 | requiere asignar permisos al crear/editar un rol | CU03 | `<<include>>` |
| CU06 | verifica si la placa ya existe / su historial | CU21 | `<<include>>` |
| CU07 | verifica si la placa ya existe / su historial | CU21 | `<<include>>` |
| CU11 | requiere buscar el vehículo antes de sancionarlo | CU21 | `<<include>>` |
| CU11 | requiere un tipo de sanción ya definido | CU10 | `<<include>>` |
| CU06 | análisis IA opcional antes de registrar | CU08 | `<<extend>>` |
| CU12 | la cámara se desconecta durante la transmisión | CU13 | `<<extend>>` |
| CU14 | usuario decide exportar el reporte mostrado | CU17 | `<<extend>>` |
| CU20 | usuario decide asignar cámaras/personal a un punto ya creado | CU16 | `<<extend>>` |
| CU16 | requiere elegir cámaras ya registradas | CU05 | `<<include>>` |

---

## Detalle con evidencia

### 1. CU01 incluido por casi todos los CU
`backend/src/app.module.ts` registra `JwtAuthGuard` como **guard global** (`APP_GUARD`). Esto significa que *toda* ruta protegida del backend exige un token JWT válido, es decir, exige haber ejecutado CU01 antes.

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

→ **CU02 a CU21 `<<include>>` CU01**, salvo el propio login y el endpoint público `auth/bootstrap-admin`.

### 2. CU02 (Gestionar Usuarios) `<<include>>` CU04 (Gestionar Roles)
`backend/src/users/dto/create-user.dto.ts` exige `roleId` como campo **obligatorio** (no `@IsOptional()`). No se puede crear ni editar un usuario sin escoger un rol del catálogo que administra CU04.

### 3. CU04 (Gestionar Roles) `<<include>>` CU03 (Asignar Permisos)
CU03 ya no es la gestión del catálogo de permisos (eso vive en `AccessController` bajo `/permissions`, fuera del alcance de este CU), sino la acción de **asignar/remover permisos a un rol concreto**: `PATCH /api/roles/:id/permissions` (`replaceRolePermissions` en `access.controller.ts`).

Esa acción es obligatoria dentro de CU04: `CreateRoleDto` (`backend/src/access/dto/create-role.dto.ts`) exige `permissionIds` con `@ArrayNotEmpty()` — no se puede crear un rol sin asignarle al menos un permiso. En el frontend, `roles/page.tsx` (líneas 61-77) muestra los checkboxes de permisos como parte del mismo formulario de "Nuevo rol". Por eso CU03 es un paso que CU04 ejecuta siempre, no una opción → `<<include>>`.

### 4. CU06 / CU07 `<<include>>` CU21 (Buscar Vehículo por Placa)
`frontend/src/app/detections/page.tsx` (función `scanPlate`, líneas 69-92): después del OCR, **siempre** se llama a:

```ts
await api(`/vehicles/history/${ocr.plate}`);
```

que es exactamente el endpoint `GET /api/vehicles/history/:plate` (la "búsqueda por placa", CU21). Este paso se ejecuta sin que el usuario lo pida explícitamente, en cada intento de registrar ingreso o salida → es `<<include>>`, no `<<extend>>`.

### 5. CU06 `<<extend>>` CU08 (Analizar Características Vehiculares con IA)
En la misma página, `analyzeVehicle()` (línea 94) llama a `/detections/analyze-vehicle` **solo si el usuario presiona el botón "Analizar"**. El resultado es opcional y, si existe, se inyecta en el formulario de `registerEntry()` (línea 113: `if (analysis) {...}`).

- Es opcional → `<<extend>>`, no `<<include>>`.
- Solo aplica a **CU06** (ingreso): `registerExit()` (línea 133) nunca usa `analysis`. CU07 **no** extiende con CU08.

### 5b. CU11 (Sancionar Vehículo) `<<include>>` CU21 y CU10
`frontend/src/app/sanctions/page.tsx` administra en realidad el **catálogo de tipos de sanción** (`/sanction-definitions`: nombre, motivo, duración) — eso es CU10. `frontend/src/app/assign-sanction/page.tsx` es la pantalla donde se **aplica** una sanción a un vehículo concreto — eso es CU11.

- Línea 27 de `assign-sanction/page.tsx`: `api<Vehiculo>(`/vehicles/history/${plate...}`)` — mismo endpoint que CU21. Paso obligatorio antes de poder sancionar → `<<include>>`.
- El `<select>` de tipo de sanción (líneas 83-87) es `required` y se llena desde `/sanction-definitions` (catálogo de CU10). `CreateSanctionDto` (`backend/src/sanctions/dto/create-sanction.dto.ts`) exige `tipoSancionId` como campo obligatorio → no se puede sancionar sin un tipo ya creado en CU10 → `<<include>>`.

### 6. CU12 `<<extend>>` CU13 (Notificar Cámara Desconectada)
`backend/src/streaming/streaming.gateway.ts` (líneas 28-41): cuando el último cliente que estaba viendo una transmisión (CU12) se desconecta, el gateway dispara automáticamente:

```ts
const alert = await this.alertsService.createInternalAlert({ typeName: 'camera_disconnected', ... });
```

El punto de extensión es "la cámara deja de transmitir mientras se está visualizando" — condición, no flujo obligatorio en cada ejecución de CU12.

### 7. CU14 `<<extend>>` CU17 (Exportar Reportes)
`frontend/src/app/reports/page.tsx` (líneas 5, 198-226): el botón **"Exportar Excel"** vive en la misma pantalla de CU14 y usa la librería `xlsx` para generar el archivo con los datos ya visualizados. Es una acción opcional del usuario sobre el reporte que ya está viendo.

### 8. CU20 `<<extend>>` CU16 (Configurar Punto de Acceso)
- `frontend/src/app/access-points/page.tsx` → CRUD puro de puntos de acceso (crear/editar/eliminar) = **CU20**.
- `frontend/src/app/access-points-config/page.tsx` → toma un punto **ya existente** (`selectAccessPoint`) y permite asignarle cámara de ingreso, cámara de salida y personal de seguridad vía `PATCH /access-points/:id` = **CU16**.

CU16 solo tiene sentido sobre un punto creado en CU20, y es un paso opcional posterior (no todo punto de acceso se reconfigura) → `<<extend>>`.

Además, dentro de la propia pantalla de CU16, los `<select>` de "Cámara de ingreso" y "Cámara de salida" (`access-points-config/page.tsx`, líneas 21, 106-124) se llenan exclusivamente con `api('/cameras')` — el catálogo de **CU05 (Gestionar Cámaras)**. No se puede configurar un punto de acceso sin elegir cámaras ya registradas ahí → **CU16 `<<include>>` CU05**, mismo patrón que CU02→CU04 y CU11→CU10.

---

## Dependencias funcionales que NO son `<<include>>`/`<<extend>>` UML estrictas

Estas existen en el código pero son dependencias de **datos**, no de comportamiento dentro de la ejecución del caso de uso, así que no se modelan como flechas UML, solo se documentan:

- **CU06/CU07 dependen de CU10/CU11**: `detections.service.ts` (líneas 86-106) consulta la tabla `sancion` para bloquear el ingreso de un vehículo sancionado y genera una alerta (`sanctioned_vehicle_attempt`). No es "incluir" el caso de uso de sancionar, solo lee su resultado.
- **Casi todas las acciones de escritura alimentan CU19**: `backend/src/audit/audit-log.interceptor.ts` está registrado como interceptor global (`APP_INTERCEPTOR` en `audit.module.ts`) y registra automáticamente cada `POST/PATCH/PUT/DELETE` sobre usuarios, roles, permisos, cámaras, puntos de acceso, vehículos, sanciones, alertas, backups y detecciones. CU19 solo **muestra** esos registros; no es invocado por las otras CU, son ellas las que alimentan su bitácora de forma transparente.
- **CU13 depende de cámaras de CU05** y **CU16 depende de puntos de acceso de CU20** — relación de datos (claves foráneas), no de flujo de ejecución.

## CU sin relaciones include/extend detectadas en el código

CU09 (Historial general, filtro propio), CU15 (Generar Backup), CU18 (Actualizar Perfil) operan de forma autónoma una vez autenticado (solo dependen de CU01 vía el guard global).
