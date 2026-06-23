import { IsIn, IsOptional, IsString } from 'class-validator';
import { CAMERA_STATUSES, CAMERA_TYPES } from '../cameras.constants';

export class CreateCameraDto {
  @IsString()
  nombre: string;

  @IsString()
  ubicacion: string;

  @IsIn(CAMERA_TYPES)
  tipoCamara: string;

  @IsOptional()
  @IsIn(CAMERA_STATUSES)
  estado?: string;
}
