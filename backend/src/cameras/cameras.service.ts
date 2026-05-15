import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertsService } from '../alerts/alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';

@Injectable()
export class CamerasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  findAll() {
    return this.prisma.camera.findMany({
      include: { cameraType: true, cameraStatus: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const camera = await this.prisma.camera.findUnique({
      where: { id },
      include: { cameraType: true, cameraStatus: true },
    });
    if (!camera) throw new NotFoundException('Camara no encontrada');
    return camera;
  }

  create(dto: CreateCameraDto) {
    return this.prisma.camera.create({
      data: dto,
      include: { cameraType: true, cameraStatus: true },
    });
  }

  async update(id: number, dto: UpdateCameraDto) {
    await this.findOne(id);
    return this.prisma.camera.update({
      where: { id },
      data: dto,
      include: { cameraType: true, cameraStatus: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.camera.delete({ where: { id } });
    return { message: 'Camara eliminada' };
  }

  findTypes() {
    return this.prisma.cameraType.findMany({ orderBy: { name: 'asc' } });
  }

  findStatuses() {
    return this.prisma.cameraStatus.findMany({ orderBy: { name: 'asc' } });
  }

  async registerDetectionFailure(cameraId: number) {
    await this.alertsService.createInternalAlert({ typeName: 'detection_failure', cameraId });
  }
}
