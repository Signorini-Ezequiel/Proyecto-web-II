import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { CreateCarDto } from '../../cars/dto/create-car.dto';

export class CreatePublishedCarDto extends CreateCarDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  sellerId: number;
}
