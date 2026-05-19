import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ComparisonCarDto {
  @ApiProperty({ example: '1' })
  @IsString()
  carId: string;
}
