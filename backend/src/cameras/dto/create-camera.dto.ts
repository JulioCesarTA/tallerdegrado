import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCameraDto {
  @IsString()
  name: string;

  @IsString()
  location: string;

  @Type(() => Number)
  @IsInt()
  cameraTypeId: number;

  @Type(() => Number)
  @IsInt()
  cameraStatusId: number;

  @IsOptional()
  @IsString()
  streamLink?: string;
}
