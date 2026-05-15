import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  roleId: true,
  role: { select: { id: true, name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ select: userSelect, orderBy: { name: 'asc' } });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (exists) throw new ConflictException('El correo ya existe');

    await this.ensureRoleExists(dto.roleId);
    const password = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password,
        roleId: dto.roleId,
      },
      select: userSelect,
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.ensureExists(id);
    if (dto.roleId) await this.ensureRoleExists(dto.roleId);

    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.email) data.email = dto.email.toLowerCase();
    if (dto.roleId) data.roleId = dto.roleId;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({ where: { id }, data, select: userSelect });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuario eliminado' };
  }

  private async ensureExists(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
  }

  private async ensureRoleExists(roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
    if (!role) throw new NotFoundException('Rol no encontrado');
  }
}
