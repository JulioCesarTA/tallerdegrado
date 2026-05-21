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
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: dto.email.toLowerCase() },
      include: {
        rol: { include: { permisos: { include: { permiso: true } } } },
      },
    });

    if (!usuario) throw new UnauthorizedException('Credenciales invalidas');

    const validPassword = await bcrypt.compare(dto.password, usuario.password);
    if (!validPassword) throw new UnauthorizedException('Credenciales invalidas');

    return this.buildSession(usuario);
  }

  async me(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: {
          select: {
            id: true,
            nombre: true,
            permisos: { include: { permiso: { select: { id: true, nombre: true } } } },
          },
        },
      },
    });

    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');
    return { ...usuario, permissions: usuario.rol.permisos.map((item) => item.permiso) };
  }

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const totalUsers = await this.prisma.usuario.count();
    if (totalUsers > 0) throw new BadRequestException('El administrador inicial ya fue creado');

    await this.accessService.seedDefaults();
    const adminRol = await this.prisma.rol.findUnique({
      where: { nombre: 'Administrador' },
      select: { id: true },
    });

    if (!adminRol) throw new BadRequestException('No se pudo inicializar el rol administrador');

    const password = await bcrypt.hash(dto.password, 10);
    const usuario = await this.prisma.usuario.create({
      data: { nombre: dto.name, correo: dto.email.toLowerCase(), password, rolId: adminRol.id },
      include: { rol: { include: { permisos: { include: { permiso: true } } } } },
    });

    return this.buildSession(usuario);
  }

  private buildSession(usuario: {
    id: number;
    nombre: string;
    correo: string;
    rol: { nombre: string; permisos: Array<{ permiso: { nombre: string } }> };
  }) {
    const permissions = usuario.rol.permisos.map((item) => item.permiso.nombre);
    const accessToken = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.correo,
      role: usuario.rol.nombre,
      permissions,
    });
    return {
      accessToken,
      user: {
        id: usuario.id,
        name: usuario.nombre,
        email: usuario.correo,
        role: usuario.rol.nombre,
        permissions,
      },
    };
  }
}
