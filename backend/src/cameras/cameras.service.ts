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
    return this.prisma.camara.findMany({
      include: { tipoCamara: true, estadoCamara: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const camara = await this.prisma.camara.findUnique({
      where: { id },
      include: { tipoCamara: true, estadoCamara: true },
    });
    if (!camara) throw new NotFoundException('Camara no encontrada');
    return camara;
  }

  create(dto: CreateCameraDto) {
    return this.prisma.camara.create({
      data: {
        nombre: dto.nombre,
        ubicacion: dto.ubicacion,
        tipoCamaraId: dto.tipoCamaraId,
        estadoCamaraId: dto.estadoCamaraId,
      },
      include: { tipoCamara: true, estadoCamara: true },
    });
  }

  async update(id: number, dto: UpdateCameraDto) {
    await this.findOne(id);
    return this.prisma.camara.update({
      where: { id },
      data: dto,
      include: { tipoCamara: true, estadoCamara: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.camara.delete({ where: { id } });
    return { message: 'Camara eliminada' };
  }

  findTypes() {
    return this.prisma.tipoCamara.findMany({ orderBy: { nombre: 'asc' } });
  }

  findStatuses() {
    return this.prisma.estadoCamara.findMany({ orderBy: { nombre: 'asc' } });
  }

  async registerDetectionFailure(camaraId: number) {
    await this.alertsService.createInternalAlert({ typeName: 'detection_failure', camaraId });
  }
}
