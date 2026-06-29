import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const MATERIALIZED_VIEWS = [
  'mv_accesos_diarios',
  'mv_accesos_franja',
  'mv_top_vehiculos',
  'mv_permanencia',
  'mv_sanciones_tipo',
];

@Injectable()
export class BiService {
  private readonly logger = new Logger(BiService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Refresca las vistas materializadas de BI cada 1 minuto (ETL liviano para Metabase)
  @Cron('*/1 * * * *')
  async refreshViews() {
    for (const view of MATERIALIZED_VIEWS) {
      try {
        await this.prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW ${view}`);
      } catch (error) {
        this.logger.warn(`No se pudo refrescar ${view}: ${(error as Error).message}`);
      }
    }
  }
}
