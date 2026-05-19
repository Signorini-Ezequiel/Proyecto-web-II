import {
  IsOptional,
  IsString,
} from 'class-validator';

import {
  PartialType,
  OmitType,
} from '@nestjs/swagger';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, [
    'password',
    'email',
    'role',
  ] as const),
) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}