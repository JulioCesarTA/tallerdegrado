-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('admin', 'operador');

-- CreateEnum
CREATE TYPE "public"."CameraType" AS ENUM ('entrada', 'salida');

-- CreateEnum
CREATE TYPE "public"."CameraStatus" AS ENUM ('activa', 'inactiva', 'error', 'desconectada');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('ingreso', 'salida');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('valido', 'revision');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('camera_disconnected', 'camera_error', 'detection_failure');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Camera" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" "public"."CameraType" NOT NULL,
    "source" TEXT NOT NULL,
    "status" "public"."CameraStatus" NOT NULL DEFAULT 'activa',
    "consecutiveDetectionFailure" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_events" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cameraId" TEXT NOT NULL,
    "eventType" "public"."EventType" NOT NULL,
    "plate" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "vehicleType" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'valido',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Alert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "cameraId" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "vehicle_events_cameraId_idx" ON "public"."vehicle_events"("cameraId");

-- CreateIndex
CREATE INDEX "vehicle_events_plate_idx" ON "public"."vehicle_events"("plate");

-- CreateIndex
CREATE INDEX "Alert_isRead_idx" ON "public"."Alert"("isRead");

-- AddForeignKey
ALTER TABLE "public"."vehicle_events" ADD CONSTRAINT "vehicle_events_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "public"."Camera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "public"."Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."vehicle_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
