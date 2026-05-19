import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class AnswerCarQuestionDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  sellerId: number;

  @ApiProperty({ example: 'Si, cuenta con service oficial registrado.' })
  @IsString()
  @MinLength(2)
  answer: string;
}
