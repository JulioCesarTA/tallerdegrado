import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class BackupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async generate() {
    const snapshot = await this.buildSnapshot();
    const stored = await this.storageService.saveBackup(JSON.stringify(snapshot, null, 2));
    return { fileName: stored.fileName, url: stored.url, generatedAt: snapshot.generatedAt };
  }

  private async buildSnapshot() {
    const [users, roles, permissions, cameras, vehicles, accessLogs, sanctions, sanctionDefinitions, alerts] =
      await Promise.all([
        this.prisma.user.findMany({ select: { id: true, name: true, email: true, roleId: true } }),
        this.prisma.role.findMany(),
        this.prisma.permission.findMany(),
        this.prisma.camera.findMany(),
        this.prisma.vehicle.findMany(),
        this.prisma.accessLog.findMany(),
        this.prisma.sanction.findMany(),
        this.prisma.sanctionDefinition.findMany(),
        this.prisma.alert.findMany(),
      ]);

    return { generatedAt: new Date().toISOString(), users, roles, permissions, cameras, vehicles, accessLogs, sanctions, sanctionDefinitions, alerts };
  }
}
