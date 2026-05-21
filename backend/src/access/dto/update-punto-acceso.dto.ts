import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePuntoAccesoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

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
