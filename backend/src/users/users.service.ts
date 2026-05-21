import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const usuarioSelect = {
  id: true,
  nombre: true,
  correo: true,
  rolId: true,
  rol: { select: { id: true, nombre: true } },
} as const;

const usuarioWithCamerasSelect = {
  ...usuarioSelect,
  puntosAcceso: {
    take: 1,
    select: {
      camaraIngresoId: true,
      camaraSalidaId: true,
      camaraIngreso: true,
      camaraSalida: true,
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.usuario.findMany({ select: usuarioSelect, orderBy: { nombre: 'asc' } });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id }, select: usuarioWithCamerasSelect });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const { puntosAcceso, ...rest } = usuario;
    const ap = puntosAcceso[0] ?? null;
    return {
      ...rest,
      camaraIngresoId: ap?.camaraIngresoId ?? null,
      camaraSalidaId: ap?.camaraSalidaId ?? null,
      camaraIngreso: ap?.camaraIngreso ?? null,
      camaraSalida: ap?.camaraSalida ?? null,
    };
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.usuario.findUnique({
      where: { correo: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (exists) throw new ConflictException('El correo ya existe');

    await this.ensureRoleExists(dto.roleId);
    const password = await bcrypt.hash(dto.password, 10);

    return this.prisma.usuario.create({
      data: {
        nombre: dto.name,
        correo: dto.email.toLowerCase(),
        password,
        rolId: dto.roleId,
      },
      select: usuarioSelect,
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.ensureExists(id);
    if (dto.roleId) await this.ensureRoleExists(dto.roleId);

    const data: Record<string, unknown> = {};
    if (dto.name) data.nombre = dto.name;
    if (dto.email) data.correo = dto.email.toLowerCase();
    if (dto.roleId) data.rolId = dto.roleId;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    return this.prisma.usuario.update({ where: { id }, data, select: usuarioSelect });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.usuario.delete({ where: { id } });
    return { message: 'Usuario eliminado' };
  }

  private async ensureExists(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id }, select: { id: true } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
  }

  private async ensureRoleExists(roleId: number) {
    const rol = await this.prisma.rol.findUnique({ where: { id: roleId }, select: { id: true } });
    if (!rol) throw new NotFoundException('Rol no encontrado');
  }
}
