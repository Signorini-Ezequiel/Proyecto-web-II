import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnswerCarQuestionDto {
  @ApiProperty({ example: 'seller_uuid_or_id' })
  @IsString()
  sellerId: string;

  @ApiProperty({ example: 'Si, cuenta con service oficial registrado.' })
  @IsString()
  @MinLength(2)
  answer: string;
}
