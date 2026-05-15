import { IsInt, IsString, Min } from 'class-validator';

export class CreateSanctionDefinitionDto {
  @IsString()
  name: string;

  @IsString()
  reason: string;

  @IsInt()
  @Min(1)
  durationDays: number;
}
