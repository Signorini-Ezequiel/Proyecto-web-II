import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FavoriteDto {
  @ApiProperty({ example: '1' })
  @IsString()
  carId: string;
}
