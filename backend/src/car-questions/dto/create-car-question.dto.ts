import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCarQuestionDto {
  @ApiProperty({ example: '1' })
  @IsString()
  carId: string;

  @ApiProperty({ example: 'buyer_uuid_or_id' })
  @IsOptional()
  @IsString()
  buyerId: string;

  @ApiProperty({ example: 'seller_uuid_or_id' })
  @IsOptional()
  @IsString()
  sellerId: string;

  @ApiProperty({ example: 'Tiene service oficial al dia?' })
  @IsString()
  question: string;
}
