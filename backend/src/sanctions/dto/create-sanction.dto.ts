import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateSanctionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicleId?: number;

  @IsOptional()
  @IsString()
  plate?: string;

  @Type(() => Number)
  @IsInt()
  sanctionDefinitionId: number;
}
