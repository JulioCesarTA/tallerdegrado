import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AccessService } from './access.service';
import { AssignRolePermissionsDto } from './dto/assign-role-permissions.dto';
import { CreatePuntoAccesoDto } from './dto/create-punto-acceso.dto';
import { UpdatePuntoAccesoDto } from './dto/update-punto-acceso.dto';

@Controller()
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('permissions')
  findPermissions() {
    return this.accessService.findPermissions();
  }

  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.accessService.createPermission(dto);
  }

  @Patch('permissions/:id')
  updatePermission(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePermissionDto) {
    return this.accessService.updatePermission(id, dto);
  }

  @Delete('permissions/:id')
  removePermission(@Param('id', ParseIntPipe) id: number) {
    return this.accessService.removePermission(id);
  }

  @Get('roles')
  findRoles() {
    return this.accessService.findRoles();
  }

  @Get('roles/:id')
  findRole(@Param('id', ParseIntPipe) id: number) {
    return this.accessService.findRole(id);
  }

  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.accessService.createRole(dto);
  }

  @Patch('roles/:id')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.accessService.updateRole(id, dto);
  }

  @Patch('roles/:id/permissions')
  replaceRolePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRolePermissionsDto,
  ) {
    return this.accessService.replaceRolePermissions(id, dto);
  }

  @Delete('roles/:id')
  removeRole(@Param('id', ParseIntPipe) id: number) {
    return this.accessService.removeRole(id);
  }

  // --- PuntoAcceso ---

  @Get('access-points')
  findAccessPoints() {
    return this.accessService.findAccessPoints();
  }

  @Post('access-points')
  createAccessPoint(@Body() dto: CreatePuntoAccesoDto) {
    return this.accessService.createAccessPoint(dto);
  }

  @Patch('access-points/:id')
  updateAccessPoint(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePuntoAccesoDto) {
    return this.accessService.updateAccessPoint(id, dto);
  }

  @Delete('access-points/:id')
  removeAccessPoint(@Param('id', ParseIntPipe) id: number) {
    return this.accessService.removeAccessPoint(id);
  }
}
