import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CarSpecsDto {
  @ApiProperty({ example: '1.8L 4 cilindros' })
  @IsString()
  engine: string;

  @ApiProperty({ example: '140 CV' })
  @IsString()
  power: string;

  @ApiProperty({ example: '173 Nm', required: false })
  @IsOptional()
  @IsString()
  torque?: string;

  @ApiProperty({ example: '0-100 km/h en 10.2s', required: false })
  @IsOptional()
  @IsString()
  acceleration?: string;

  @ApiProperty({ example: '180 km/h' })
  @IsString()
  topSpeed: string;

  @ApiProperty({ example: '6.5L/100km' })
  @IsString()
  consumption: string;

  @ApiProperty({ example: '4.46m x 1.83m x 1.62m', required: false })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiProperty({ example: '1.280 kg' })
  @IsString()
  weight: string;

  @ApiProperty({
    type: [String],
    example: ['Bluetooth', 'Camara de retroceso'],
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];
}
