import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class RegisterEntryDto {
  @IsString()
  placa: string;

  @Type(() => Number)
  @IsInt()
  cameraId: number;

  @IsOptional() @IsString() marca?: string;
  @IsOptional() @IsString() modelo?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() tipoVehiculo?: string;
  @IsOptional() @IsString() caracteristicas?: string;
  @IsOptional() @IsString() evidenceUrl?: string;
}
