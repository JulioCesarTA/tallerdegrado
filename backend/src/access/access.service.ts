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

const roleInclude = {
  permissions: {
    include: { permission: true },
  },
};

@Injectable()
export class AccessService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async seedDefaults() {
    for (const name of SYSTEM_PERMISSIONS) {
      await this.prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
    }

    for (const role of DEFAULT_ROLES) {
      const upserted = await this.prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: { name: role.name },
      });

      const permissions = await this.prisma.permission.findMany({
        where: { name: { in: [...role.permissions] } },
        select: { id: true },
      });

      await this.prisma.rolePermission.deleteMany({ where: { roleId: upserted.id } });

      if (permissions.length) {
        await this.prisma.rolePermission.createMany({
          data: permissions.map((p) => ({ roleId: upserted.id, permissionId: p.id })),
          skipDuplicates: true,
        });
      }
    }

    const cameraTypes = ['entrada', 'salida'];
    for (const name of cameraTypes) {
      await this.prisma.cameraType.upsert({ where: { name }, update: {}, create: { name } });
    }

    const cameraStatuses = ['activa', 'inactiva', 'falla', 'mantenimiento'];
    for (const name of cameraStatuses) {
      await this.prisma.cameraStatus.upsert({ where: { name }, update: {}, create: { name } });
    }

    const alertTypes = [
      'camera_disconnected',
      'camera_error',
      'detection_failure',
      'sanctioned_vehicle_attempt',
      'network_failure',
      'system_interruption',
    ];
    for (const name of alertTypes) {
      await this.prisma.alertType.upsert({ where: { name }, update: {}, create: { name } });
    }

    const tipoVehiculos = ['moto', 'auto'];
    for (const name of tipoVehiculos) {
      await this.prisma.tipoVehiculo.upsert({ where: { name }, update: {}, create: { name } });
    }
  }

  findPermissions() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  async createPermission(dto: CreatePermissionDto) {
    try {
      return await this.prisma.permission.create({ data: { name: dto.name } });
    } catch {
      throw new ConflictException('Ya existe un permiso con ese nombre');
    }
  }

  async updatePermission(id: number, dto: UpdatePermissionDto) {
    await this.ensurePermissionExists(id);
    return this.prisma.permission.update({ where: { id }, data: dto });
  }

  async removePermission(id: number) {
    await this.ensurePermissionExists(id);
    await this.prisma.permission.delete({ where: { id } });
    return { message: 'Permiso eliminado' };
  }

  findRoles() {
    return this.prisma.role.findMany({ include: roleInclude, orderBy: { name: 'asc' } });
  }

  async findRole(id: number) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: roleInclude });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  async createRole(dto: CreateRoleDto) {
    const permissions = await this.findPermissionsByIds(dto.permissionIds);

    return this.prisma.role.create({
      data: {
        name: dto.name,
        permissions: {
          create: permissions.map((p) => ({ permissionId: p.id })),
        },
      },
      include: roleInclude,
    });
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    await this.ensureRoleExists(id);

    if (dto.permissionIds) {
      await this.findPermissionsByIds(dto.permissionIds);
    }

    await this.prisma.role.update({ where: { id }, data: { name: dto.name } });

    if (dto.permissionIds) {
      await this.replaceRolePermissions(id, { permissionIds: dto.permissionIds });
    }

    return this.findRole(id);
  }

  async replaceRolePermissions(id: number, dto: AssignRolePermissionsDto) {
    await this.ensureRoleExists(id);
    const permissions = await this.findPermissionsByIds(dto.permissionIds);

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: id, permissionId: p.id })),
      skipDuplicates: true,
    });

    return this.findRole(id);
  }

  async removeRole(id: number) {
    await this.ensureRoleExists(id);

    const usersCount = await this.prisma.user.count({ where: { roleId: id } });
    if (usersCount > 0) {
      throw new ConflictException('No puedes eliminar un rol asignado a usuarios');
    }

    await this.prisma.role.delete({ where: { id } });
    return { message: 'Rol eliminado' };
  }

  async getRoleSnapshotByUserId(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: { include: roleInclude } },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      role: user.role.name,
      roleName: user.role.name,
      permissions: user.role.permissions.map((item) => item.permission.name),
    };
  }

  private async ensureRoleExists(id: number) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  private async ensurePermissionExists(id: number) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) throw new NotFoundException('Permiso no encontrado');
    return permission;
  }

  private async findPermissionsByIds(ids: number[]) {
    const permissions = await this.prisma.permission.findMany({ where: { id: { in: ids } } });
    if (permissions.length !== ids.length) throw new NotFoundException('Uno o mas permisos no existen');
    return permissions;
  }
}
