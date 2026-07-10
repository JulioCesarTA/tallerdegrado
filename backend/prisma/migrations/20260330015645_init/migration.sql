-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "apellido" VARCHAR(50),
    "ci" VARCHAR(20),
    "correo" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "rol" VARCHAR(50) NOT NULL DEFAULT 'Operador',
    "resetCode" VARCHAR(6),
    "resetCodeExp" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Camara" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "ubicacion" VARCHAR(100) NOT NULL,
    "tipoCamara" VARCHAR(50) NOT NULL,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'activa',

    CONSTRAINT "Camara_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vehiculo" (
    "id" SERIAL NOT NULL,
    "placa" VARCHAR(20) NOT NULL,
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "tipoVehiculo" VARCHAR(50),
    "color" VARCHAR(50),
    "caracteristicas" VARCHAR(500),

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PuntoAcceso" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "ubicacion" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(255),
    "estado" VARCHAR(50) NOT NULL DEFAULT 'activo',
    "camaraIngresoId" INTEGER,
    "camaraSalidaId" INTEGER,
    "usuarioId" INTEGER,

    CONSTRAINT "PuntoAcceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RegistroAcceso" (
    "id" SERIAL NOT NULL,
    "vehiculoId" INTEGER NOT NULL,
    "puntoAccesoIngresoId" INTEGER,
    "puntoAccesoEgresoId" INTEGER,
    "horaIngreso" TIMESTAMP(3) NOT NULL,
    "horaSalida" TIMESTAMP(3),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urlEvidencia" VARCHAR(500),
    "estado" VARCHAR(20) NOT NULL,
    "plazaId" INTEGER,

    CONSTRAINT "RegistroAcceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Backup" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" VARCHAR(500) NOT NULL,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TipoSancion" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "motivo" VARCHAR(200) NOT NULL,
    "duracionDias" INTEGER NOT NULL,

    CONSTRAINT "TipoSancion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sancion" (
    "id" SERIAL NOT NULL,
    "vehiculoId" INTEGER NOT NULL,
    "tipoSancionId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),

    CONSTRAINT "Sancion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Alerta" (
    "id" SERIAL NOT NULL,
    "tipoAlerta" VARCHAR(100) NOT NULL,
    "camaraId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoAlerta" VARCHAR(50) NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Parqueo" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "ubicacion" VARCHAR(150) NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,

    CONSTRAINT "Parqueo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plaza" (
    "id" SERIAL NOT NULL,
    "parqueoId" INTEGER NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'libre',

    CONSTRAINT "Plaza_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "public"."Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_placa_key" ON "public"."Vehiculo"("placa");

-- CreateIndex
CREATE INDEX "Vehiculo_placa_idx" ON "public"."Vehiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "PuntoAcceso_camaraIngresoId_key" ON "public"."PuntoAcceso"("camaraIngresoId");

-- CreateIndex
CREATE UNIQUE INDEX "PuntoAcceso_camaraSalidaId_key" ON "public"."PuntoAcceso"("camaraSalidaId");

-- CreateIndex
CREATE INDEX "RegistroAcceso_vehiculoId_idx" ON "public"."RegistroAcceso"("vehiculoId");

-- CreateIndex
CREATE INDEX "RegistroAcceso_fecha_idx" ON "public"."RegistroAcceso"("fecha");

-- AddForeignKey
ALTER TABLE "public"."PuntoAcceso" ADD CONSTRAINT "PuntoAcceso_camaraIngresoId_fkey" FOREIGN KEY ("camaraIngresoId") REFERENCES "public"."Camara"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PuntoAcceso" ADD CONSTRAINT "PuntoAcceso_camaraSalidaId_fkey" FOREIGN KEY ("camaraSalidaId") REFERENCES "public"."Camara"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PuntoAcceso" ADD CONSTRAINT "PuntoAcceso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegistroAcceso" ADD CONSTRAINT "RegistroAcceso_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "public"."Vehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegistroAcceso" ADD CONSTRAINT "RegistroAcceso_puntoAccesoIngresoId_fkey" FOREIGN KEY ("puntoAccesoIngresoId") REFERENCES "public"."PuntoAcceso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegistroAcceso" ADD CONSTRAINT "RegistroAcceso_puntoAccesoEgresoId_fkey" FOREIGN KEY ("puntoAccesoEgresoId") REFERENCES "public"."PuntoAcceso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegistroAcceso" ADD CONSTRAINT "RegistroAcceso_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "public"."Plaza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Backup" ADD CONSTRAINT "Backup_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sancion" ADD CONSTRAINT "Sancion_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "public"."Vehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sancion" ADD CONSTRAINT "Sancion_tipoSancionId_fkey" FOREIGN KEY ("tipoSancionId") REFERENCES "public"."TipoSancion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alerta" ADD CONSTRAINT "Alerta_camaraId_fkey" FOREIGN KEY ("camaraId") REFERENCES "public"."Camara"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Plaza" ADD CONSTRAINT "Plaza_parqueoId_fkey" FOREIGN KEY ("parqueoId") REFERENCES "public"."Parqueo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

