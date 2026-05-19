import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty({ example: '3f7df6d2-8b2a-4996-90c5-f7dc3adfb89f' })
  id!: string;

  @ApiProperty({ example: 'Jane Seller' })
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SELLER })
  role!: UserRole;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar!: string | null;

  @ApiProperty({ example: '2026-05-11T20:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-11T20:00:00.000Z' })
  updatedAt!: Date;
}

export class AuthProfileDto {
  @ApiProperty({ example: '3f7df6d2-8b2a-4996-90c5-f7dc3adfb89f' })
  id!: string;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SELLER })
  role!: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}
