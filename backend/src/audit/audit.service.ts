import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(usuarioId: number | null, accion: string, modulo: string, detalle?: string) {
    await this.prisma.logSistema.create({
      data: { usuarioId, accion, modulo, detalle },
    });
  }

  findAll() {
    return this.prisma.logSistema.findMany({
      orderBy: { fecha: 'desc' },
      take: 300,
      include: { usuario: { select: { id: true, nombre: true, correo: true } } },
    });
  }
}
