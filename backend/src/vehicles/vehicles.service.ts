import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

const vehiculoInclude = {
  sanciones: {
    include: { tipoSancion: { select: { id: true, nombre: true, motivo: true } } },
    orderBy: { fechaInicio: 'desc' as const },
  },
  registrosAcceso: {
    orderBy: { horaIngreso: 'desc' as const },
    take: 20,
    include: {
      puntoAccesoIngreso: { select: { id: true, nombre: true } },
      puntoAccesoEgreso: { select: { id: true, nombre: true } },
    },
  },
};

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.vehiculo.findMany({
      where: search
        ? { placa: { contains: search.toUpperCase(), mode: 'insensitive' } }
        : undefined,
      include: vehiculoInclude,
      orderBy: { placa: 'asc' },
    });
  }

  async findOne(id: number) {
    const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id }, include: vehiculoInclude });
    if (!vehiculo) throw new NotFoundException('Vehiculo no encontrado');
    return vehiculo;
  }

  async create(dto: CreateVehicleDto) {
    const exists = await this.prisma.vehiculo.findUnique({
      where: { placa: dto.plate.toUpperCase() },
      select: { id: true },
    });
    if (exists) throw new ConflictException('La placa ya existe');

    return this.prisma.vehiculo.create({
      data: {
        placa: dto.plate.toUpperCase(),
        marca: dto.brand,
        modelo: dto.model,
        color: dto.color,
        tipoVehiculo: dto.vehicleType,
      },
      include: vehiculoInclude,
    });
  }

  async update(id: number, dto: UpdateVehicleDto) {
    await this.ensureExists(id);
    return this.prisma.vehiculo.update({
      where: { id },
      data: {
        ...(dto.plate ? { placa: dto.plate.toUpperCase() } : {}),
        ...(dto.brand !== undefined ? { marca: dto.brand } : {}),
        ...(dto.model !== undefined ? { modelo: dto.model } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.vehicleType !== undefined ? { tipoVehiculo: dto.vehicleType } : {}),
      },
      include: vehiculoInclude,
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.vehiculo.delete({ where: { id } });
    return { message: 'Vehiculo eliminado' };
  }

  async findByPlate(plate: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa: plate.toUpperCase() },
      include: vehiculoInclude,
    });
    if (!vehiculo) throw new NotFoundException('No existe vehiculo con esa placa');
    return vehiculo;
  }

  private async ensureExists(id: number) {
    const vehiculo = await this.prisma.vehiculo.findUnique({ where: { id }, select: { id: true } });
    if (!vehiculo) throw new NotFoundException('Vehiculo no encontrado');
  }
}
