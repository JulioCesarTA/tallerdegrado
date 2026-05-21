import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class BackupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async generate(usuarioId: number) {
    const snapshot = await this.buildSnapshot();
    const stored = await this.storageService.saveBackup(JSON.stringify(snapshot, null, 2));
    await this.prisma.backup.create({
      data: { usuarioId, url: stored.url, fecha: new Date() },
    });
    return { fileName: stored.fileName, url: stored.url, generatedAt: snapshot.generatedAt };
  }

  private async buildSnapshot() {
    const [usuarios, roles, permisos, camaras, vehiculos, registrosAcceso, sanciones, tipoSanciones, alertas] =
      await Promise.all([
        this.prisma.usuario.findMany({ select: { id: true, nombre: true, correo: true, rolId: true } }),
        this.prisma.rol.findMany(),
        this.prisma.permiso.findMany(),
        this.prisma.camara.findMany(),
        this.prisma.vehiculo.findMany(),
        this.prisma.registroAcceso.findMany(),
        this.prisma.sancion.findMany(),
        this.prisma.tipoSancion.findMany(),
        this.prisma.alerta.findMany(),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      usuarios,
      roles,
      permisos,
      camaras,
      vehiculos,
      registrosAcceso,
      sanciones,
      tipoSanciones,
      alertas,
    };
  }
}
