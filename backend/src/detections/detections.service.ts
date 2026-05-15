import { BadRequestException, Injectable } from '@nestjs/common';
import { AlertsService } from '../alerts/alerts.service';
import { CamerasService } from '../cameras/cameras.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { VisionService } from '../vision/vision.service';
import { ProcessDetectionDto } from './dto/process-detection.dto';

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

  async process(dto: ProcessDetectionDto, file: Express.Multer.File | undefined, type: 'entry' | 'exit') {
    if (!file) throw new BadRequestException('La imagen es obligatoria');

    const stored = await this.storageService.saveImage(file);
    const [ocr, analysis] = await Promise.all([
      this.visionService.extractPlate(file),
      this.visionService.analyzeVehicle(file),
    ]);

    if (ocr.confidence < 0.7) {
      await this.camerasService.registerDetectionFailure(dto.cameraId);
    }

    const normalizedPlate = dto.plateOverride
      ? dto.plateOverride.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : ocr.plate.toUpperCase();
    const now = new Date();

    const vehicle = await this.prisma.vehicle.upsert({
      where: { plate: normalizedPlate },
      update: {
        ...(analysis.color ? { color: analysis.color } : {}),
        ...(analysis.model ? { model: analysis.model } : {}),
        ...(analysis.brand ? { brand: analysis.brand } : {}),
      },
      create: {
        plate: normalizedPlate,
        color: analysis.color,
        model: analysis.model,
        brand: analysis.brand,
      },
    });

    if (type === 'entry') {
      await this.prisma.accessLog.create({
        data: {
          vehicleId: vehicle.id,
          ingresoCameraId: dto.cameraId,
          ingresoAt: now,
          evidenceUrl: stored.url,
        },
      });
    } else {
      const openLog = await this.prisma.accessLog.findFirst({
        where: { vehicleId: vehicle.id, egresoAt: null },
        orderBy: { ingresoAt: 'desc' },
      });

      if (openLog) {
        await this.prisma.accessLog.update({
          where: { id: openLog.id },
          data: { salidaCameraId: dto.cameraId, egresoAt: now },
        });
      } else {
        await this.prisma.accessLog.create({
          data: {
            vehicleId: vehicle.id,
            salidaCameraId: dto.cameraId,
            ingresoAt: now,
            egresoAt: now,
            evidenceUrl: stored.url,
          },
        });
      }
    }

    const activeSanction = await this.prisma.sanction.findFirst({
      where: { vehicleId: vehicle.id, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    });

    if (type === 'entry' && activeSanction) {
      await this.alertsService.createInternalAlert({
        typeName: 'sanctioned_vehicle_attempt',
        cameraId: dto.cameraId,
      });
    }

    return {
      plate: normalizedPlate,
      confidence: ocr.confidence,
      brand: analysis.brand,
      model: analysis.model,
      color: analysis.color,
      damageDetails: analysis.damageDetails,
      summary: analysis.summary,
      evidenceUrl: stored.url,
      vehicle,
      sanctioned: !!activeSanction,
    };
  }
}
