import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  permissionIds: number[];
}
