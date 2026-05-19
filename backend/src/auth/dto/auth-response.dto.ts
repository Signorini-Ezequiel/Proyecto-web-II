import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/types/user-role';

export class AuthUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Bruno Lopez' })
  name: string;

  @ApiProperty({ example: 'buyer@autopoint.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.Buyer })
  role: UserRole;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ example: true })
  ok: true;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;
}
