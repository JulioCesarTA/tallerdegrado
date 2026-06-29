import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AccessModule } from './access/access.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { BackupsModule } from './backups/backups.module';
import { BiModule } from './bi/bi.module';
import { CamerasModule } from './cameras/cameras.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { DetectionsModule } from './detections/detections.module';
import { ParqueoModule } from './parqueo/parqueo.module';
import { PlazaModule } from './plaza/plaza.module';
import { PrismaModule } from './prisma/prisma.module';
import { SanctionDefinitionsModule } from './sanction-definitions/sanction-definitions.module';
import { SanctionsModule } from './sanctions/sanctions.module';
import { StorageModule } from './storage/storage.module';
import { StreamingModule } from './streaming/streaming.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'src', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    BiModule,
    AccessModule,
    StorageModule,
    AlertsModule,
    AuthModule,
    UsersModule,
    CamerasModule,
    DetectionsModule,
    VehiclesModule,
    SanctionsModule,
    SanctionDefinitionsModule,
    BackupsModule,
    StreamingModule,
    ParqueoModule,
    PlazaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
