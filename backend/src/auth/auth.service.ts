import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccessService } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly accessService: AccessService,
    private readonly auditService: AuditService,
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

    void this.auditService.log(usuario.id, 'Inicio de sesion', 'Autenticacion', usuario.correo);
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

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    const data: Record<string, unknown> = {};

    if (dto.name) data.nombre = dto.name;

    if (dto.email && dto.email.toLowerCase() !== usuario.correo) {
      const exists = await this.prisma.usuario.findUnique({
        where: { correo: dto.email.toLowerCase() },
        select: { id: true },
      });
      if (exists) throw new ConflictException('El correo ya esta en uso');
      data.correo = dto.email.toLowerCase();
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) throw new BadRequestException('Debes indicar tu contrasena actual');
      const validPassword = await bcrypt.compare(dto.currentPassword, usuario.password);
      if (!validPassword) throw new UnauthorizedException('Contrasena actual incorrecta');
      data.password = await bcrypt.hash(dto.newPassword, 10);
    }

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data,
      include: { rol: { include: { permisos: { include: { permiso: true } } } } },
    });

    void this.auditService.log(userId, 'Actualizar', 'Mi perfil', dto.newPassword ? 'Datos y contrasena' : 'Datos de perfil');
    return this.buildSession(updated);
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
