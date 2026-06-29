-- Vistas materializadas para BI (Metabase)
-- Refrescar con: REFRESH MATERIALIZED VIEW <nombre>;

-- 1. Accesos por dia (ingresos / salidas / rechazados)
DROP MATERIALIZED VIEW IF EXISTS mv_accesos_diarios;
CREATE MATERIALIZED VIEW mv_accesos_diarios AS
SELECT date_trunc('day', "fecha")::date AS dia,
       COUNT(*) FILTER (WHERE "estado" = 'ingreso')  AS ingresos,
       COUNT(*) FILTER (WHERE "estado" = 'salida')   AS salidas,
       COUNT(*) FILTER (WHERE "estado" = 'denegado') AS rechazados
FROM "RegistroAcceso"
GROUP BY 1
ORDER BY 1;

-- 2. Accesos por franja horaria
DROP MATERIALIZED VIEW IF EXISTS mv_accesos_franja;
CREATE MATERIALIZED VIEW mv_accesos_franja AS
SELECT CASE
         WHEN EXTRACT(HOUR FROM "horaIngreso") BETWEEN 6 AND 11  THEN 'Manana'
         WHEN EXTRACT(HOUR FROM "horaIngreso") BETWEEN 12 AND 18 THEN 'Tarde'
         ELSE 'Noche'
       END AS franja,
       COUNT(*) AS total
FROM "RegistroAcceso"
WHERE "estado" = 'ingreso'
GROUP BY 1;

-- 3. Top vehiculos mas frecuentes
DROP MATERIALIZED VIEW IF EXISTS mv_top_vehiculos;
CREATE MATERIALIZED VIEW mv_top_vehiculos AS
SELECT v."placa", v."marca", v."tipoVehiculo", COUNT(*) AS visitas
FROM "RegistroAcceso" r
JOIN "Vehiculo" v ON v."id" = r."vehiculoId"
GROUP BY 1, 2, 3
ORDER BY visitas DESC;

-- 4. Tiempo promedio de permanencia por dia (minutos)
DROP MATERIALIZED VIEW IF EXISTS mv_permanencia;
CREATE MATERIALIZED VIEW mv_permanencia AS
SELECT date_trunc('day', "fecha")::date AS dia,
       AVG(EXTRACT(EPOCH FROM ("horaSalida" - "horaIngreso")) / 60)::int AS minutos_prom
FROM "RegistroAcceso"
WHERE "horaSalida" IS NOT NULL
GROUP BY 1;

-- 5. Sanciones por tipo
DROP MATERIALIZED VIEW IF EXISTS mv_sanciones_tipo;
CREATE MATERIALIZED VIEW mv_sanciones_tipo AS
SELECT t."nombre" AS tipo, COUNT(*) AS cantidad
FROM "Sancion" s
JOIN "TipoSancion" t ON t."id" = s."tipoSancionId"
GROUP BY 1;
