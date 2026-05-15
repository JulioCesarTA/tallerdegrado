import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccessService } from '../access/access.service';
import { PrismaService } from '../prisma/prisma.service';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly accessService: AccessService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!user) throw new UnauthorizedException('Credenciales invalidas');

    const validPassword = await bcrypt.compare(dto.password, user.password);
    if (!validPassword) throw new UnauthorizedException('Credenciales invalidas');

    return this.buildSession(user);
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: { include: { permission: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return { ...user, permissions: user.role.permissions.map((item) => item.permission) };
  }

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const totalUsers = await this.prisma.user.count();
    if (totalUsers > 0) throw new BadRequestException('El administrador inicial ya fue creado');

    await this.accessService.seedDefaults();
    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'Administrador' },
      select: { id: true },
    });

    if (!adminRole) throw new BadRequestException('No se pudo inicializar el rol administrador');

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email.toLowerCase(), password, roleId: adminRole.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    return this.buildSession(user);
  }

  private buildSession(user: {
    id: number;
    name: string;
    email: string;
    role: { name: string; permissions: Array<{ permission: { name: string } }> };
  }) {
    const permissions = user.role.permissions.map((item) => item.permission.name);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    });
    return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role.name, permissions } };
  }
}
