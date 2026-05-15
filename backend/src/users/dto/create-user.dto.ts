import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @Type(() => Number)
  @IsInt()
  roleId: number;
}
