import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSanctionDto } from './dto/create-sanction.dto';

const sanctionInclude = {
  vehicle: { select: { id: true, plate: true, brand: true, model: true } },
  definition: { select: { id: true, name: true, reason: true, durationDays: true } },
};

@Injectable()
export class SanctionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.sanction.findMany({ include: sanctionInclude, orderBy: { startsAt: 'desc' } });
  }

  async create(dto: CreateSanctionDto) {
    const vehicleId = dto.vehicleId ?? (await this.findVehicleIdByPlate(dto.plate));

    const definition = await this.prisma.sanctionDefinition.findUnique({
      where: { id: dto.sanctionDefinitionId },
      select: { durationDays: true },
    });
    if (!definition) throw new NotFoundException('Definicion de sancion no encontrada');

    const startsAt = new Date();
    const endsAt = definition.durationDays
      ? new Date(Date.now() + definition.durationDays * 86_400_000)
      : undefined;

    return this.prisma.sanction.create({
      data: { vehicleId, sanctionDefinitionId: dto.sanctionDefinitionId, startsAt, endsAt },
      include: sanctionInclude,
    });
  }

  async remove(id: number) {
    const sanction = await this.prisma.sanction.findUnique({ where: { id }, select: { id: true } });
    if (!sanction) throw new NotFoundException('Sancion no encontrada');
    await this.prisma.sanction.delete({ where: { id } });
    return { message: 'Sancion eliminada' };
  }

  private async findVehicleIdByPlate(plate?: string) {
    if (!plate) throw new BadRequestException('Se requiere vehicleId o plate');
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate: plate.toUpperCase() },
      select: { id: true },
    });
    if (!vehicle) throw new NotFoundException('Vehiculo no encontrado');
    return vehicle.id;
  }
}
