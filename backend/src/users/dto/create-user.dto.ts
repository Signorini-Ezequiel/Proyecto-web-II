import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../common/types/user-role';

export class CreateUserDto {
  @ApiProperty({
    example: 'Lucia Fernandez',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'usuario@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Clave123',
  })
  @IsString()
  @MinLength(6)
  @Matches(/[A-Za-z]/, {
    message:
      'password must contain at least one letter',
  })
  @Matches(/\d/, {
    message:
      'password must contain at least one number',
  })
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.Seller,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    example:
      '/uploads/avatar.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
