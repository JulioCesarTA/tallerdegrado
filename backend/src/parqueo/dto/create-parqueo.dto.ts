import { IsString } from 'class-validator';

export class CreateParqueoDto {
  @IsString()
  nombre: string;

  @IsString()
  ubicacion: string;

  @IsString()
  tipo: string;
}
