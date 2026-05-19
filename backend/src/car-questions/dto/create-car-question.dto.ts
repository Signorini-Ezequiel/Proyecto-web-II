import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCarQuestionDto {
  @ApiProperty({ example: '1' })
  @IsString()
  carId: string;

  @ApiProperty({ example: 'buyer_uuid_or_id' })
  @IsString()
  buyerId: string;

  @ApiProperty({ example: 'seller_uuid_or_id' })
  @IsString()
  sellerId: string;

  @ApiProperty({ example: 'Tiene service oficial al dia?' })
  @IsString()
  @MinLength(8)
  question: string;
}
