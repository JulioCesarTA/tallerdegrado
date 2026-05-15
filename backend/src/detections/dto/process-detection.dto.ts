import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ProcessDetectionDto {
  @Type(() => Number)
  @IsInt()
  cameraId: number;

  @IsOptional()
  @IsString()
  plateOverride?: string;
}
