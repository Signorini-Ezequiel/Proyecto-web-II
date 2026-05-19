import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { FuelType, Transmission } from '@prisma/client';

export class CreateCarDto {
  @ApiProperty({ example: 'Toyota Corolla XEi 2.0' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  brand!: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  model!: string;

  @ApiProperty({ example: 2021, minimum: 1900, maximum: 2027 })
  @IsInt()
  @Min(1900)
  @Max(2027)
  year!: number;

  @ApiProperty({ example: 45000, minimum: 0 })
  @IsInt()
  @Min(0)
  mileage!: number;

  @ApiProperty({ example: 21500, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({
    example: 'Unico dueno, service oficial al dia y cubiertas nuevas.',
  })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: 170, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  horsepower?: number;

  @ApiProperty({ enum: FuelType, example: FuelType.GASOLINE })
  @IsEnum(FuelType)
  fuelType!: FuelType;

  @ApiProperty({ enum: Transmission, example: Transmission.AUTOMATIC })
  @IsEnum(Transmission)
  transmission!: Transmission;

  @ApiProperty({ example: 'Buenos Aires, Argentina' })
  @IsString()
  location!: string;

  @ApiProperty({
    example: [
      'https://example.com/images/corolla-front.jpg',
      'https://example.com/images/corolla-side.jpg',
    ],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images!: string[];
}
