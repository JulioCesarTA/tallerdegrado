# Gestionar Usuario — Diagrama de Comunicación (Colaboración)

Diagrama de comunicación del caso de uso **Gestionar Usuario** (CRUD), desde la
página del frontend hasta la base de datos, atravesando todas las capas reales
del sistema: cliente HTTP, Nginx, guard de autenticación, pipe de validación,
controller, service, repositorios (Prisma) y base de datos PostgreSQL.

> Stack real: **Next.js** (frontend) + **NestJS** (backend) + **Prisma** + **PostgreSQL**, detrás de **Nginx**.

## Capas y archivos involucrados

| Objeto | Archivo / Origen |
|--------|------------------|
| `UsersPage` | `frontend/src/app/users/page.tsx` |
| `api()` (cliente HTTP) | `frontend/src/lib/api.ts` |
| `Nginx` | `nginx/` (reverse proxy) |
| `JwtAuthGuard` | `backend/src/common/guards/jwt-auth.guard.ts` (APP_GUARD global) |
| `ValidationPipe` | `backend/src/main.ts` (useGlobalPipes) |
| `UsersController` | `backend/src/users/users.controller.ts` |
| `UsersService` | `backend/src/users/users.service.ts` |
| `bcrypt` | librería de hash de contraseñas |
| `UsuarioRepository` | `prisma.usuario` (`PrismaService`) |
| `RolRepository` | `prisma.rol` (`PrismaService`) |
| `BD` | PostgreSQL |

## Diagrama

```plantuml
@startuml Gestionar_Usuario_Diagrama_Comunicacion

title Diagrama de Comunicacion - Gestionar Usuario (CRUD completo)

left to right direction

skinparam objectBorderColor #34495E
skinparam objectBackgroundColor #ECF0F1
skinparam ArrowColor #2C3E50

actor "Administrador" as Admin

object ":UsersPage\n(frontend/app/users)" as Page
object ":api()\n(lib/api.ts)" as Api
object ":Nginx\n(reverse proxy)" as Nginx
object ":JwtAuthGuard\n(common/guards)" as Guard
object ":ValidationPipe\n(main.ts)" as Pipe
object ":UsersController\n(backend/users)" as Ctrl
object ":UsersService\n(backend/users)" as Svc
object ":bcrypt" as Bcrypt
object ":UsuarioRepository\n(prisma.usuario)" as UsuarioRepo
object ":RolRepository\n(prisma.rol)" as RolRepo
database "PostgreSQL" as DB

' ============================================================
' 1. LISTAR USUARIOS  (GET /api/users)
' ============================================================
Admin   --> Page  : "1: listarUsuarios()"
Page    --> Api   : "1.1: api('/users')"
Api     --> Nginx : "1.1.1: GET /api/users\n(Bearer token)"
Nginx   --> Guard : "1.1.2: canActivate()"
Guard   --> Ctrl  : "1.1.3 [token valido]: findAll()"
Ctrl    --> Svc   : "1.1.4: findAll()"
Svc     --> UsuarioRepo : "1.1.5: usuario.findMany({select, orderBy})"
UsuarioRepo --> DB : "1.1.6: SELECT * FROM usuario"
DB      --> UsuarioRepo : "1.1.7: filas usuario"
UsuarioRepo --> Svc : "1.1.8: Usuario[]"
Svc     --> Ctrl  : "1.1.9: Usuario[]"
Ctrl    --> Page  : "1.1.10: 200 OK [usuarios]"

' ============================================================
' 2. VER DETALLE  (GET /api/users/:id)
' ============================================================
Admin   --> Page  : "2: verUsuario(id)"
Page    --> Api   : "2.1: api('/users/'+id)"
Api     --> Nginx : "2.1.1: GET /api/users/:id"
Nginx   --> Guard : "2.1.2: canActivate()"
Guard   --> Ctrl  : "2.1.3 [token valido]: findOne(id)"
Ctrl    --> Svc   : "2.1.4: findOne(id)"
Svc     --> UsuarioRepo : "2.1.5: usuario.findUnique({id, +puntosAcceso})"
UsuarioRepo --> DB : "2.1.6: SELECT ... WHERE id = ?"
DB      --> UsuarioRepo : "2.1.7: fila usuario | null"
UsuarioRepo --> Svc : "2.1.8: usuario"
Svc     --> Ctrl  : "2.1.9 [no existe]: NotFoundException"
Svc     --> Ctrl  : "2.1.10 [existe]: Usuario + camaras"
Ctrl    --> Page  : "2.1.11: 200 OK | 404"

' ============================================================
' 3. CREAR USUARIO  (POST /api/users)
' ============================================================
Admin   --> Page  : "3: crearUsuario(form)"
Page    --> Api   : "3.1: api('/users', POST, dto)"
Api     --> Nginx : "3.1.1: POST /api/users {dto}"
Nginx   --> Guard : "3.1.2: canActivate()"
Guard   --> Pipe  : "3.1.3 [token valido]: validate(CreateUserDto)"
Pipe    --> Ctrl  : "3.1.4 [dto valido]: create(dto)"
Ctrl    --> Svc   : "3.1.5: create(dto)"
Svc     --> UsuarioRepo : "3.1.6: usuario.findUnique({correo})"
UsuarioRepo --> DB : "3.1.7: SELECT ... WHERE correo = ?"
DB      --> UsuarioRepo : "3.1.8: resultado"
UsuarioRepo --> Svc : "3.1.9: existe?"
Svc     --> Ctrl  : "3.1.10 [correo existe]: ConflictException"
Svc     --> RolRepo : "3.1.11 [correo libre]: rol.findUnique({roleId})"
RolRepo --> DB    : "3.1.12: SELECT ... FROM rol WHERE id = ?"
DB      --> RolRepo : "3.1.13: fila rol | null"
RolRepo --> Svc   : "3.1.14: rol"
Svc     --> Ctrl  : "3.1.15 [rol no existe]: NotFoundException"
Svc     --> Bcrypt : "3.1.16 [rol existe]: hash(password, 10)"
Bcrypt  --> Svc   : "3.1.17: passwordHash"
Svc     --> UsuarioRepo : "3.1.18: usuario.create({data})"
UsuarioRepo --> DB : "3.1.19: INSERT INTO usuario"
DB      --> UsuarioRepo : "3.1.20: usuario creado"
UsuarioRepo --> Svc : "3.1.21: Usuario"
Svc     --> Ctrl  : "3.1.22: Usuario"
Ctrl    --> Page  : "3.1.23: 201 Created"

' ============================================================
' 4. ACTUALIZAR USUARIO  (PATCH /api/users/:id)
' ============================================================
Admin   --> Page  : "4: editarUsuario(id, form)"
Page    --> Api   : "4.1: api('/users/'+id, PATCH, dto)"
Api     --> Nginx : "4.1.1: PATCH /api/users/:id {dto}"
Nginx   --> Guard : "4.1.2: canActivate()"
Guard   --> Pipe  : "4.1.3 [token valido]: validate(UpdateUserDto)"
Pipe    --> Ctrl  : "4.1.4 [dto valido]: update(id, dto)"
Ctrl    --> Svc   : "4.1.5: update(id, dto)"
Svc     --> UsuarioRepo : "4.1.6: usuario.findUnique({id}) [ensureExists]"
UsuarioRepo --> DB : "4.1.7: SELECT id WHERE id = ?"
DB      --> UsuarioRepo : "4.1.8: resultado"
UsuarioRepo --> Svc : "4.1.9: existe?"
Svc     --> Ctrl  : "4.1.10 [no existe]: NotFoundException"
Svc     --> RolRepo : "4.1.11 [hay roleId]: rol.findUnique({roleId})"
RolRepo --> Svc   : "4.1.12: rol"
Svc     --> Bcrypt : "4.1.13 [hay password]: hash(password, 10)"
Bcrypt  --> Svc   : "4.1.14: passwordHash"
Svc     --> UsuarioRepo : "4.1.15: usuario.update({id, data})"
UsuarioRepo --> DB : "4.1.16: UPDATE usuario SET ... WHERE id = ?"
DB      --> UsuarioRepo : "4.1.17: usuario actualizado"
UsuarioRepo --> Svc : "4.1.18: Usuario"
Svc     --> Ctrl  : "4.1.19: Usuario"
Ctrl    --> Page  : "4.1.20: 200 OK"

' ============================================================
' 5. ELIMINAR USUARIO  (DELETE /api/users/:id)
' ============================================================
Admin   --> Page  : "5: eliminarUsuario(id)"
Page    --> Api   : "5.1: api('/users/'+id, DELETE)"
Api     --> Nginx : "5.1.1: DELETE /api/users/:id"
Nginx   --> Guard : "5.1.2: canActivate()"
Guard   --> Ctrl  : "5.1.3 [token valido]: remove(id)"
Ctrl    --> Svc   : "5.1.4: remove(id)"
Svc     --> UsuarioRepo : "5.1.5: usuario.findUnique({id}) [ensureExists]"
UsuarioRepo --> DB : "5.1.6: SELECT id WHERE id = ?"
DB      --> UsuarioRepo : "5.1.7: resultado"
UsuarioRepo --> Svc : "5.1.8: existe?"
Svc     --> Ctrl  : "5.1.9 [no existe]: NotFoundException"
Svc     --> UsuarioRepo : "5.1.10 [existe]: usuario.delete({id})"
UsuarioRepo --> DB : "5.1.11: DELETE FROM usuario WHERE id = ?"
DB      --> UsuarioRepo : "5.1.12: ok"
UsuarioRepo --> Svc : "5.1.13: ok"
Svc     --> Ctrl  : "5.1.14: {message: 'Usuario eliminado'}"
Ctrl    --> Page  : "5.1.15: 200 OK"

@enduml
```

## Notas de diseño

- **Autenticación**: `JwtAuthGuard` está registrado como `APP_GUARD` global
  (`app.module.ts`), por lo que **toda** petición pasa por él antes del controller.
  El token (`Bearer`) lo agrega `api()` desde `getToken()` (`lib/auth.ts`).
- **Validación**: el `ValidationPipe` global (`main.ts`) valida `CreateUserDto` /
  `UpdateUserDto` solo en operaciones con cuerpo (POST / PATCH); por eso aparece
  únicamente en los flujos 3 y 4.
- **Repositorios**: en NestJS+Prisma no hay clases *Repository* explícitas; el rol
  de repositorio lo cumple `PrismaService` a través de los modelos
  `prisma.usuario` y `prisma.rol`. Se representan como `UsuarioRepository` y
  `RolRepository` para reflejar la capa de acceso a datos.
- **Reglas de negocio en el service**: correo único (`ConflictException`),
  existencia de rol y de usuario (`NotFoundException`), y hash de contraseña con
  `bcrypt` antes de persistir.
- **Prefijo de API**: `setGlobalPrefix('api')` → todas las rutas son `/api/users`.

---

### Cómo visualizarlo
Pega el bloque `@startuml ... @enduml` en [PlantUML online](https://www.plantuml.com/plantuml)
o usa la extensión *PlantUML* de VS Code (requiere Graphviz para algunos layouts).
