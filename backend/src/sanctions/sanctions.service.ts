import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSanctionDto } from './dto/create-sanction.dto';

const sancionInclude = {
  vehiculo: { select: { id: true, placa: true, marca: true, modelo: true } },
  tipoSancion: { select: { id: true, nombre: true, motivo: true, duracionDias: true } },
};

@Injectable()
export class SanctionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.sancion.findMany({ include: sancionInclude, orderBy: { fechaInicio: 'desc' } });
  }

  async create(dto: CreateSanctionDto) {
    const vehiculoId = dto.vehiculoId ?? (await this.findVehicleIdByPlate(dto.placa));

    const tipoSancion = await this.prisma.tipoSancion.findUnique({
      where: { id: dto.tipoSancionId },
      select: { duracionDias: true },
    });
    if (!tipoSancion) throw new NotFoundException('Tipo de sancion no encontrado');

    const fechaInicio = new Date();
    const fechaFin = tipoSancion.duracionDias
      ? new Date(Date.now() + tipoSancion.duracionDias * 86_400_000)
      : undefined;

    return this.prisma.sancion.create({
      data: { vehiculoId, tipoSancionId: dto.tipoSancionId, fechaInicio, fechaFin },
      include: sancionInclude,
    });
  }

  async remove(id: number) {
    const sancion = await this.prisma.sancion.findUnique({ where: { id }, select: { id: true } });
    if (!sancion) throw new NotFoundException('Sancion no encontrada');
    await this.prisma.sancion.delete({ where: { id } });
    return { message: 'Sancion eliminada' };
  }

  private async findVehicleIdByPlate(placa?: string) {
    if (!placa) throw new BadRequestException('Se requiere vehiculoId o placa');
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa: placa.toUpperCase() },
      select: { id: true },
    });
    if (!vehiculo) throw new NotFoundException('Vehiculo no encontrado');
    return vehiculo.id;
  }
}
