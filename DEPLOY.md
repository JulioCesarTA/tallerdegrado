# Guía de Deploy — AWS EC2 Ubuntu

## Estructura de archivos generados

```
/
├── backend/
│   ├── Dockerfile          ← producción (multi-stage)
│   ├── Dockerfile.dev      ← desarrollo
│   ├── entrypoint.sh       ← espera postgres + aplica migraciones
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile          ← producción (multi-stage)
│   ├── Dockerfile.dev      ← desarrollo
│   └── .dockerignore
├── nginx/
│   └── nginx.conf          ← reverse proxy
├── docker-compose.yml      ← producción
├── docker-compose.dev.yml  ← overrides para desarrollo
├── .env.example            ← plantilla de variables
└── DEPLOY.md               ← esta guía
```

---

## 1 — Puertos a abrir en EC2 (Security Group)

| Puerto | Protocolo | Origen    | Para qué            |
|--------|-----------|-----------|---------------------|
| 22     | TCP       | Tu IP     | SSH                 |
| 80     | TCP       | 0.0.0.0/0 | HTTP (Nginx)        |
| 443    | TCP       | 0.0.0.0/0 | HTTPS (futuro)      |

> ⚠️ NO abras el puerto 3001 ni 3000 ni 5432 al público.
> Todos se comunican internamente en la red Docker.

---

## 2 — Preparar el servidor EC2 (Ubuntu 22.04)

```bash
# Conectarse
ssh -i tu-clave.pem ubuntu@TU_IP_EC2

# Actualizar
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# Verificar
docker --version
docker compose version
```

---

## 3 — Subir el proyecto a GitHub y clonarlo en EC2

```bash
# En tu PC local — asegurarte de que .env NO está commiteado
git status   # no debe aparecer .env

# En EC2
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
```

---

## 4 — Configurar variables de entorno

```bash
# Copiar la plantilla
cp .env.example .env

# Editar con tus valores reales
nano .env
```

El `.env` debe quedar así:
```
EC2_HOST=54.123.45.67        ← tu IP pública de EC2
DB_USERNAME=admin
DB_PASSWORD=password_seguro
JWT_SECRET=secreto_muy_largo
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-2
AWS_REKOGNITION_REGION=us-east-2
AWS_S3_BUCKET=proyectodegrado1
AWS_S3_EVIDENCE_PREFIX=evidences
AWS_S3_BACKUP_PREFIX=backups
CLAUDE_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-haiku-4-5-20251001
```

---

## 5 — Primer deploy (construcción completa)

```bash
docker compose up --build -d
```

Esto:
1. Descarga imagen de PostgreSQL
2. Construye imagen del backend (compila TypeScript)
3. Construye imagen del frontend (compila Next.js con tu IP embebida)
4. Levanta Nginx en puerto 80

---

## 6 — Verificar que todo funciona

```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

La app estará disponible en: `http://TU_IP_EC2`

---

## 7 — Cómo actualizar el proyecto desde GitHub

```bash
# Traer cambios
git pull origin main

# Reconstruir y reiniciar todo
docker compose up --build -d

# O solo reconstruir un servicio
docker compose up --build -d backend
docker compose up --build -d frontend
```

---

## 8 — Comandos útiles

```bash
# Detener todo (sin borrar datos)
docker compose down

# Detener y borrar volúmenes (¡BORRA LA BASE DE DATOS!)
docker compose down -v

# Reiniciar un servicio sin reconstruir
docker compose restart backend

# Ejecutar un comando dentro del contenedor
docker compose exec backend sh
docker compose exec postgres psql -U admin -d control_vehicular

# Ver uso de recursos
docker stats
```

---

## 9 — Desarrollo local con Docker

```bash
# Levantar en modo desarrollo (hot-reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Frontend en: http://localhost:3000
# Backend en:  http://localhost:3001
# Prisma Studio: npx prisma studio (en otra terminal)
```

---

## 10 — Cómo funciona el networking

```
Internet → Puerto 80 → Nginx
                         ├── /auth, /users, /cameras... → backend:3001 (NestJS)
                         ├── /socket.io/               → backend:3001 (WebSocket)
                         ├── /uploads/                 → backend:3001 (archivos)
                         └── /  (todo lo demás)        → frontend:3000 (Next.js)
```

- Los contenedores se comunican por nombre dentro de `app-network`
- PostgreSQL NUNCA es accesible desde internet
- `NEXT_PUBLIC_API_URL` se embebe en el build del frontend con tu IP de EC2

---

## 11 — Cómo conecta Next.js con NestJS en producción

`NEXT_PUBLIC_API_URL=http://TU_IP_EC2` se pasa como `ARG` al build del frontend.

```typescript
// frontend/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
// En prod: http://54.123.45.67

// Las llamadas van a http://54.123.45.67/auth/login
// Nginx las recibe y las reenvía a http://backend:3001/auth/login
```

Socket.IO también usa la misma IP, con namespace `/stream` o `/reports`.
Nginx maneja el upgrade WebSocket automáticamente.

---

## 12 — HTTPS con Certbot (opcional, requiere dominio)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com

# Certbot edita nginx.conf automáticamente
# Renueva automático cada 90 días
```
