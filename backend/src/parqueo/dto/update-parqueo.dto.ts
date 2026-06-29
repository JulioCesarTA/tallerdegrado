import { PartialType } from '@nestjs/mapped-types';
import { CreateParqueoDto } from './create-parqueo.dto';

export class UpdateParqueoDto extends PartialType(CreateParqueoDto) {}
