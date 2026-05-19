import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'abc123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newpass123' })
  @IsString()
  @MinLength(6)
  @Matches(/[A-Za-z]/, { message: 'newPassword must contain at least one letter' })
  @Matches(/\d/, { message: 'newPassword must contain at least one number' })
  newPassword: string;

  @ApiProperty({ example: 'newpass123' })
  @IsString()
  confirmPassword: string;
}
