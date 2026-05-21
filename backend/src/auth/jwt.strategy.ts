import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: AuthUser): Promise<AuthUser> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        correo: true,
        rol: {
          include: {
            permisos: {
              include: { permiso: { select: { nombre: true } } },
            },
          },
        },
      },
    });

    if (!usuario) throw new UnauthorizedException('Token invalido');

    return {
      sub: usuario.id,
      email: usuario.correo,
      role: usuario.rol.nombre,
      permissions: usuario.rol.permisos.map((item) => item.permiso.nombre),
    };
  }
}
