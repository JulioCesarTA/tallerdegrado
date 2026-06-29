import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePlazaDto {
  @Type(() => Number)
  @IsInt()
  parqueoId: number;

  @IsString()
  codigo: string;

  @IsString()
  tipo: string;

  @IsOptional()
  @IsString()
  estado?: string;
}
