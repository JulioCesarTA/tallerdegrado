# ─── Stage 1: Dependencias ────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_* se embebe en el build — debe pasarse como ARG
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ─── Stage 3: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario sin privilegios por seguridad
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=deps    /app/node_modules          ./node_modules
COPY --from=builder /app/.next                 ./.next
COPY --from=builder /app/public                ./public
COPY                package*.json              ./
COPY                next.config.ts             ./

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
