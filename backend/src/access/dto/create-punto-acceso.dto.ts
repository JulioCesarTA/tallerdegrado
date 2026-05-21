import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class CreatePuntoAccesoDto {
  @IsString()
  nombre: string;

  @IsString()
  ubicacion: string;

  @IsInt()
  @Type(() => Number)
  camaraIngresoId: number;

  @IsInt()
  @Type(() => Number)
  camaraSalidaId: number;

  @IsInt()
  @Type(() => Number)
  usuarioId: number;
}
