import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateCarDto } from '../../cars/dto/create-car.dto';

export class CreatePublishedCarDto extends CreateCarDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  sellerId: string;
}
