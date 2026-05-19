import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CarSpecsDto } from './car-specs.dto';

export class CreateCarDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Corolla Cross' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1900)
  year: number;

  @ApiProperty({ example: 27800 })
  @IsPositive()
  price: number;

  @ApiProperty({ example: 42000 })
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiProperty({ example: 'Automatica' })
  @IsString()
  transmission: string;

  @ApiProperty({ example: 'Nafta' })
  @IsString()
  fuel: string;

  @ApiProperty({ example: 'Blanco' })
  @IsString()
  color: string;

  @ApiProperty({ example: 'Cordoba' })
  @IsString()
  location: string;

  @ApiProperty({ example: 'Excelente estado, unico dueno.' })
  @IsString()
  description: string;

  @ApiProperty({ type: [String], example: ['/images/auto1-1.jpg'] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ type: CarSpecsDto })
  @ValidateNested()
  @Type(() => CarSpecsDto)
  specs: CarSpecsDto;
}
