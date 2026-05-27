import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AnswerCarQuestionDto {
  @ApiProperty({ example: 'seller_uuid_or_id' })
  @IsOptional()
  @IsString()
  sellerId: string;

  @ApiProperty({ example: 'Si, cuenta con service oficial registrado.' })
  @IsString()
  answer: string;
}
