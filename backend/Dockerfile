# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (mejor cache de capas)
COPY package*.json ./
RUN npm ci

# Generar Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copiar y compilar el código fuente
COPY . .
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Solo instalar dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar Prisma (schema + cliente generado)
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copiar binario compilado
COPY --from=builder /app/dist ./dist

# Script de inicio: aplica migraciones y arranca el servidor
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
