import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateQuestionThreadDto {
  @ApiProperty({ example: 'car_uuid' })
  @IsString()
  carId: string;

  @ApiProperty({ example: 'Aceptas permuta por menor valor?' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  content: string;
}
