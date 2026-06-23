import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePuntoAccesoDto {
  @IsString()
  nombre: string;

  @IsString()
  ubicacion: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  camaraIngresoId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  camaraSalidaId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  usuarioId?: number;
}
