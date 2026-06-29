import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async requestPasswordReset(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: email.toLowerCase() },
      select: { id: true, correo: true },
    });

    // Respondemos igual exista o no, para no revelar que correos estan registrados
    if (usuario) {
      const code = String(randomInt(100000, 1000000)); // 6 digitos
      const resetCodeExp = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { resetCode: code, resetCodeExp },
      });
      await this.mailService.sendResetCode(usuario.correo, code);
    }

    return { message: 'Si el correo esta registrado, te enviamos un codigo de recuperacion' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: dto.email.toLowerCase() },
    });

    if (!usuario || !usuario.resetCode || !usuario.resetCodeExp) {
      throw new BadRequestException('Solicita un codigo de recuperacion primero');
    }
    if (usuario.resetCode !== dto.code) {
      throw new BadRequestException('Codigo incorrecto');
    }
    if (usuario.resetCodeExp < new Date()) {
      throw new BadRequestException('El codigo expiro, solicita uno nuevo');
    }

    const password = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { password, resetCode: null, resetCodeExp: null },
    });

    return { message: 'Contrasena actualizada' };
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: dto.email.toLowerCase() },
    });

    if (!usuario) throw new UnauthorizedException('Credenciales invalidas');

    const validPassword = await bcrypt.compare(dto.password, usuario.password);
    if (!validPassword) throw new UnauthorizedException('Credenciales invalidas');

    return this.buildSession(usuario);
  }

  async me(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, nombre: true, correo: true, rol: true },
    });

    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');
    return { ...usuario, permissions: [] };
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

    const updated = await this.prisma.usuario.update({ where: { id: userId }, data });

    return this.buildSession(updated);
  }

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const totalUsers = await this.prisma.usuario.count();
    if (totalUsers > 0) throw new BadRequestException('El administrador inicial ya fue creado');

    const password = await bcrypt.hash(dto.password, 10);
    const usuario = await this.prisma.usuario.create({
      data: { nombre: dto.name, correo: dto.email.toLowerCase(), password, rol: 'Administrador' },
    });

    return this.buildSession(usuario);
  }

  private buildSession(usuario: { id: number; nombre: string; correo: string; rol: string }) {
    const accessToken = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.correo,
      role: usuario.rol,
      permissions: [],
    });
    return {
      accessToken,
      user: {
        id: usuario.id,
        name: usuario.nombre,
        email: usuario.correo,
        role: usuario.rol,
        permissions: [],
      },
    };
  }
}
