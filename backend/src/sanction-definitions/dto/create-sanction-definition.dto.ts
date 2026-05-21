import { IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSanctionDefinitionDto {
  @IsString()
  nombre: string;

  @IsString()
  motivo: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  duracionDias: number;
}
