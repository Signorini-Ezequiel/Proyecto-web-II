import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateCarQuestionDto {
  @ApiProperty({ example: '1' })
  @IsString()
  carId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  buyerId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  sellerId: number;

  @ApiProperty({ example: 'Tiene service oficial al dia?' })
  @IsString()
  @MinLength(8)
  question: string;
}
