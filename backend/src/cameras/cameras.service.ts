import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertsService } from '../alerts/alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { CAMERA_STATUSES, CAMERA_TYPES } from './cameras.constants';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';

@Injectable()
export class CamerasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  findAll() {
    return this.prisma.camara.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const camara = await this.prisma.camara.findUnique({ where: { id } });
    if (!camara) throw new NotFoundException('Camara no encontrada');
    return camara;
  }

  create(dto: CreateCameraDto) {
    return this.prisma.camara.create({
      data: {
        nombre: dto.nombre,
        ubicacion: dto.ubicacion,
        tipoCamara: dto.tipoCamara,
        estado: dto.estado,
      },
    });
  }

  async update(id: number, dto: UpdateCameraDto) {
    await this.findOne(id);
    return this.prisma.camara.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.camara.delete({ where: { id } });
    return { message: 'Camara eliminada' };
  }

  findTypes() {
    return CAMERA_TYPES;
  }

  findStatuses() {
    return CAMERA_STATUSES;
  }

  async registerDetectionFailure(camaraId: number) {
    await this.alertsService.createInternalAlert({ typeName: 'detection_failure', camaraId });
  }
}
