import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class RegisterExitDto {
  @IsString()
  placa: string;

  @Type(() => Number)
  @IsInt()
  cameraId: number;

  @IsOptional() @IsString() evidenceUrl?: string;
}
