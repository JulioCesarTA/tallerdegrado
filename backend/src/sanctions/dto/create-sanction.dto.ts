import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateSanctionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehiculoId?: number;

  @IsOptional()
  @IsString()
  placa?: string;

  @Type(() => Number)
  @IsInt()
  tipoSancionId: number;
}
