import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/types/user-role';

export class AuthUserDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'Bruno Lopez' })
  name: string;

  @ApiProperty({ example: 'usuario@example.com' })
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
