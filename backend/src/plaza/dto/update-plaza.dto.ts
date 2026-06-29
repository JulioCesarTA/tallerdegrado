import { PartialType } from '@nestjs/mapped-types';
import { CreatePlazaDto } from './create-plaza.dto';

export class UpdatePlazaDto extends PartialType(CreatePlazaDto) {}
