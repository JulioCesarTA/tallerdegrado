#!/bin/sh
set -e

echo "⏳ Esperando que PostgreSQL esté listo..."
until npx prisma db execute --schema=prisma/schema.prisma --stdin <<'SQL'
SELECT 1;
SQL
do
  echo "PostgreSQL no disponible aún — reintentando en 2s..."
  sleep 2
done

echo "✅ PostgreSQL listo."
echo "🔄 Aplicando migraciones..."
npx prisma migrate deploy

echo "🚀 Iniciando servidor NestJS..."
exec node dist/main
