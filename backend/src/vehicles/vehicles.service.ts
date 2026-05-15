import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

const vehicleInclude = {
  tipoVehiculo: { select: { id: true, name: true } },
  sanctions: {
    include: { definition: { select: { id: true, name: true, reason: true } } },
    orderBy: { startsAt: 'desc' as const },
  },
  accessLogs: {
    orderBy: { ingresoAt: 'desc' as const },
    take: 20,
    include: {
      ingresoCamera: { select: { id: true, name: true } },
      salidaCamera: { select: { id: true, name: true } },
    },
  },
};

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.vehicle.findMany({
      where: search
        ? { plate: { contains: search.toUpperCase(), mode: 'insensitive' } }
        : undefined,
      include: vehicleInclude,
      orderBy: { plate: 'asc' },
    });
  }

  async findOne(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id }, include: vehicleInclude });
    if (!vehicle) throw new NotFoundException('Vehiculo no encontrado');
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const exists = await this.prisma.vehicle.findUnique({
      where: { plate: dto.plate.toUpperCase() },
      select: { id: true },
    });
    if (exists) throw new ConflictException('La placa ya existe');

    return this.prisma.vehicle.create({
      data: { ...dto, plate: dto.plate.toUpperCase() },
      include: vehicleInclude,
    });
  }

  async update(id: number, dto: UpdateVehicleDto) {
    await this.ensureExists(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: { ...dto, plate: dto.plate?.toUpperCase() },
      include: vehicleInclude,
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.vehicle.delete({ where: { id } });
    return { message: 'Vehiculo eliminado' };
  }

  async findByPlate(plate: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate: plate.toUpperCase() },
      include: vehicleInclude,
    });
    if (!vehicle) throw new NotFoundException('No existe vehiculo con esa placa');
    return vehicle;
  }

  private async ensureExists(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
    if (!vehicle) throw new NotFoundException('Vehiculo no encontrado');
  }
}
