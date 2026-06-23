import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ROLES, SYSTEM_PERMISSIONS } from './access.constants';
import { AssignRolePermissionsDto } from './dto/assign-role-permissions.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePuntoAccesoDto } from './dto/create-punto-acceso.dto';
import { UpdatePuntoAccesoDto } from './dto/update-punto-acceso.dto';

const rolInclude = {
  permisos: {
    include: { permiso: true },
  },
};

@Injectable()
export class AccessService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async seedDefaults() {
    for (const nombre of SYSTEM_PERMISSIONS) {
      await this.prisma.permiso.upsert({ where: { nombre }, update: {}, create: { nombre } });
    }

    for (const role of DEFAULT_ROLES) {
      const upserted = await this.prisma.rol.upsert({
        where: { nombre: role.name },
        update: {},
        create: { nombre: role.name },
      });

      const permisos = await this.prisma.permiso.findMany({
        where: { nombre: { in: [...role.permissions] } },
        select: { id: true },
      });

      await this.prisma.rolPermiso.deleteMany({ where: { rolId: upserted.id } });

      if (permisos.length) {
        await this.prisma.rolPermiso.createMany({
          data: permisos.map((p) => ({ rolId: upserted.id, permisoId: p.id })),
          skipDuplicates: true,
        });
      }
    }

  }

  findPermissions() {
    return this.prisma.permiso.findMany({ orderBy: { nombre: 'asc' } });
  }

  async createPermission(dto: CreatePermissionDto) {
    try {
      return await this.prisma.permiso.create({ data: { nombre: dto.name } });
    } catch {
      throw new ConflictException('Ya existe un permiso con ese nombre');
    }
  }

  async updatePermission(id: number, dto: UpdatePermissionDto) {
    await this.ensurePermissionExists(id);
    return this.prisma.permiso.update({ where: { id }, data: { nombre: (dto as any).name ?? (dto as any).nombre } });
  }

  async removePermission(id: number) {
    await this.ensurePermissionExists(id);
    await this.prisma.permiso.delete({ where: { id } });
    return { message: 'Permiso eliminado' };
  }

  findRoles() {
    return this.prisma.rol.findMany({ include: rolInclude, orderBy: { nombre: 'asc' } });
  }

  async findRole(id: number) {
    const rol = await this.prisma.rol.findUnique({ where: { id }, include: rolInclude });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    return rol;
  }

  async createRole(dto: CreateRoleDto) {
    const permisos = await this.findPermissionsByIds(dto.permissionIds);

    return this.prisma.rol.create({
      data: {
        nombre: dto.name,
        permisos: {
          create: permisos.map((p) => ({ permisoId: p.id })),
        },
      },
      include: rolInclude,
    });
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    await this.ensureRoleExists(id);

    if (dto.permissionIds) {
      await this.findPermissionsByIds(dto.permissionIds);
    }

    await this.prisma.rol.update({ where: { id }, data: { nombre: dto.name } });

    if (dto.permissionIds) {
      await this.replaceRolePermissions(id, { permissionIds: dto.permissionIds });
    }

    return this.findRole(id);
  }

  async replaceRolePermissions(id: number, dto: AssignRolePermissionsDto) {
    await this.ensureRoleExists(id);
    const permisos = await this.findPermissionsByIds(dto.permissionIds);

    await this.prisma.rolPermiso.deleteMany({ where: { rolId: id } });
    await this.prisma.rolPermiso.createMany({
      data: permisos.map((p) => ({ rolId: id, permisoId: p.id })),
      skipDuplicates: true,
    });

    return this.findRole(id);
  }

  async removeRole(id: number) {
    await this.ensureRoleExists(id);

    const usersCount = await this.prisma.usuario.count({ where: { rolId: id } });
    if (usersCount > 0) {
      throw new ConflictException('No puedes eliminar un rol asignado a usuarios');
    }

    await this.prisma.rol.delete({ where: { id } });
    return { message: 'Rol eliminado' };
  }

  async getRoleSnapshotByUserId(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { rol: { include: rolInclude } },
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    return {
      role: usuario.rol.nombre,
      roleName: usuario.rol.nombre,
      permissions: usuario.rol.permisos.map((item) => item.permiso.nombre),
    };
  }

  private async ensureRoleExists(id: number) {
    const rol = await this.prisma.rol.findUnique({ where: { id } });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    return rol;
  }

  private async ensurePermissionExists(id: number) {
    const permiso = await this.prisma.permiso.findUnique({ where: { id } });
    if (!permiso) throw new NotFoundException('Permiso no encontrado');
    return permiso;
  }

  private async findPermissionsByIds(ids: number[]) {
    const permisos = await this.prisma.permiso.findMany({ where: { id: { in: ids } } });
    if (permisos.length !== ids.length) throw new NotFoundException('Uno o mas permisos no existen');
    return permisos;
  }

  // --- PuntoAcceso ---

  findAccessPoints() {
    return this.prisma.puntoAcceso.findMany({
      include: {
        camaraIngreso: true,
        camaraSalida: true,
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async createAccessPoint(dto: CreatePuntoAccesoDto) {
    try {
      return await this.prisma.puntoAcceso.create({
        data: {
          nombre: dto.nombre,
          ubicacion: dto.ubicacion,
          descripcion: dto.descripcion,
          estado: dto.estado,
          camaraIngresoId: dto.camaraIngresoId,
          camaraSalidaId: dto.camaraSalidaId,
          usuarioId: dto.usuarioId,
        },
        include: {
          camaraIngreso: true,
          camaraSalida: true,
          usuario: { select: { id: true, nombre: true, correo: true } },
        },
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2002') throw new ConflictException('Una de las camaras ya esta asignada a otro punto de acceso');
      if (code === 'P2003') throw new NotFoundException('Camara o usuario no encontrado');
      throw e;
    }
  }

  async updateAccessPoint(id: number, dto: UpdatePuntoAccesoDto) {
    const existing = await this.prisma.puntoAcceso.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Punto de acceso no encontrado');
    return this.prisma.puntoAcceso.update({
      where: { id },
      data: dto,
      include: {
        camaraIngreso: true,
        camaraSalida: true,
        usuario: { select: { id: true, nombre: true, correo: true } },
      },
    });
  }

  async removeAccessPoint(id: number) {
    const existing = await this.prisma.puntoAcceso.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Punto de acceso no encontrado');
    await this.prisma.puntoAcceso.delete({ where: { id } });
    return { message: 'Punto de acceso eliminado' };
  }
}
