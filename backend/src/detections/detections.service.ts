import { BadRequestException, Injectable } from '@nestjs/common';
import { AlertsService } from '../alerts/alerts.service';
import { CamerasService } from '../cameras/cameras.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { VisionService } from '../vision/vision.service';
import { RegisterEntryDto } from './dto/register-entry.dto';
import { RegisterExitDto } from './dto/register-exit.dto';

// Keys must match exact TipoVehiculo.nombre values in the DB
const TIPO_VEHICULO_MAP: Record<string, string[]> = {
  moto: ['motocicleta', 'moto'],
  auto: ['automovil', 'auto', 'sedan', 'carro', 'camioneta', 'pickup', 'suv', '4x4', 'camion', 'truck'],
};

@Injectable()
export class DetectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly camerasService: CamerasService,
    private readonly alertsService: AlertsService,
    private readonly visionService: VisionService,
  ) {}

  async ocrFrame(file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('La imagen es obligatoria');
    const ocr = await this.visionService.extractPlate(file);
    return { plate: ocr.plate, confidence: ocr.confidence };
  }

  async analyzeVehicleFile(file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('La imagen es obligatoria');
    const [analysis, stored] = await Promise.all([
      this.visionService.analyzeVehicle(file),
      this.storageService.saveImage(file),
    ]);
    return { ...analysis, evidenceUrl: stored.url };
  }

  async registerEntry(dto: RegisterEntryDto, file: Express.Multer.File | undefined) {
    const placa = dto.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!placa) throw new BadRequestException('Placa invalida');
    const now = new Date();

    let evidenceUrl: string | null = null;
    if (file) {
      const stored = await this.storageService.saveImage(file);
      evidenceUrl = stored.url;
    } else if (dto.evidenceUrl) {
      evidenceUrl = dto.evidenceUrl;
    }

    const [tipoVehiculoId, puntoAcceso] = await Promise.all([
      dto.tipoVehiculo ? this.resolveTipoVehiculo(dto.tipoVehiculo) : Promise.resolve(null),
      this.prisma.puntoAcceso.findFirst({ where: { camaraIngresoId: dto.cameraId }, select: { id: true } }),
    ]);

    const vehiculo = await this.prisma.vehiculo.upsert({
      where: { placa },
      update: {
        ...(dto.color           ? { color: dto.color }                     : {}),
        ...(dto.modelo          ? { modelo: dto.modelo }                   : {}),
        ...(dto.marca           ? { marca: dto.marca }                     : {}),
        ...(dto.caracteristicas ? { caracteristicas: dto.caracteristicas } : {}),
        ...(tipoVehiculoId      ? { tipoVehiculoId }                       : {}),
      },
      create: {
        placa,
        color: dto.color ?? null,
        modelo: dto.modelo ?? null,
        marca: dto.marca ?? null,
        caracteristicas: dto.caracteristicas ?? null,
        tipoVehiculoId,
      },
    });

    const activeSanction = await this.prisma.sancion.findFirst({
      where: { vehiculoId: vehiculo.id, OR: [{ fechaFin: null }, { fechaFin: { gt: now } }] },
    });

    const estado = activeSanction ? 'denegado' : 'ingreso';
    await this.prisma.registroAcceso.create({
      data: {
        vehiculoId: vehiculo.id,
        horaIngreso: now,
        fecha: now,
        estado,
        urlEvidencia: evidenceUrl,
        ...(puntoAcceso ? { puntoAccesoIngresoId: puntoAcceso.id } : {}),
      },
    });

    if (activeSanction) {
      await this.alertsService.createInternalAlert({
        typeName: 'sanctioned_vehicle_attempt',
        camaraId: dto.cameraId,
      });
    }

    return { placa, evidenceUrl, vehicle: vehiculo, sanctioned: !!activeSanction, estado };
  }

  async registerExit(dto: RegisterExitDto, file: Express.Multer.File | undefined) {
    const placa = dto.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!placa) throw new BadRequestException('Placa invalida');
    const now = new Date();

    let evidenceUrl: string | null = null;
    if (file) {
      const stored = await this.storageService.saveImage(file);
      evidenceUrl = stored.url;
    } else if (dto.evidenceUrl) {
      evidenceUrl = dto.evidenceUrl;
    }

    const [vehiculo, puntoAcceso] = await Promise.all([
      this.prisma.vehiculo.findUnique({ where: { placa } }),
      this.prisma.puntoAcceso.findFirst({ where: { camaraSalidaId: dto.cameraId }, select: { id: true } }),
    ]);
    if (!vehiculo) throw new BadRequestException('Vehiculo no encontrado en el sistema');

    const openLog = await this.prisma.registroAcceso.findFirst({
      where: { vehiculoId: vehiculo.id, horaSalida: null, estado: 'ingreso' },
      orderBy: { horaIngreso: 'desc' },
    });

    const puntoEgresoData = puntoAcceso ? { puntoAccesoEgresoId: puntoAcceso.id } : {};

    if (openLog) {
      await this.prisma.registroAcceso.update({
        where: { id: openLog.id },
        data: { horaSalida: now, estado: 'salida', urlEvidencia: evidenceUrl ?? openLog.urlEvidencia, ...puntoEgresoData },
      });
    } else {
      await this.prisma.registroAcceso.create({
        data: { vehiculoId: vehiculo.id, horaIngreso: now, horaSalida: now, fecha: now, estado: 'salida', urlEvidencia: evidenceUrl, ...puntoEgresoData },
      });
    }

    return { placa, evidenceUrl, vehicle: vehiculo };
  }

  private async resolveTipoVehiculo(tipoStr: string): Promise<number | null> {
    const lower = tipoStr.toLowerCase();
    let nombre: string | null = null;
    for (const [key, aliases] of Object.entries(TIPO_VEHICULO_MAP)) {
      if (aliases.some((a) => lower.includes(a))) { nombre = key; break; }
    }
    if (!nombre) nombre = lower;
    // Try exact match first, then contains fallback
    const found = await this.prisma.tipoVehiculo.findFirst({
      where: { OR: [
        { nombre: { equals: nombre, mode: 'insensitive' } },
        { nombre: { contains: nombre, mode: 'insensitive' } },
      ]},
      select: { id: true },
    });
    return found?.id ?? null;
  }
}
