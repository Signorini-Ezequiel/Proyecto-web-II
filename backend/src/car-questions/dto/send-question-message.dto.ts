import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendQuestionMessageDto {
  @ApiProperty({ example: 'Si, puedo recibir menor valor y diferencia.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}
