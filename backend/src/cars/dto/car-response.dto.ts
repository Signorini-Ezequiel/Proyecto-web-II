import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelType, Transmission, UserRole } from '@prisma/client';

export class CarSellerDto {
  @ApiProperty({ example: '3f7df6d2-8b2a-4996-90c5-f7dc3adfb89f' })
  id!: string;

  @ApiProperty({ example: 'Jane Seller' })
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SELLER })
  role!: UserRole;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar!: string | null;
}

export class CarResponseDto {
  @ApiProperty({ example: '9ebaf4a2-6148-452a-9df9-2a73cb9b7223' })
  id!: string;

  @ApiProperty({ example: 'Toyota Corolla XEi 2.0' })
  title!: string;

  @ApiProperty({ example: 'Toyota' })
  brand!: string;

  @ApiProperty({ example: 'Corolla' })
  model!: string;

  @ApiProperty({ example: 2021 })
  year!: number;

  @ApiProperty({ example: 45000 })
  mileage!: number;

  @ApiProperty({ example: '21500' })
  price!: string;

  @ApiProperty({ example: 'Unico dueno, service oficial al dia.' })
  description!: string;

  @ApiPropertyOptional({ example: 170 })
  horsepower!: number | null;

  @ApiProperty({ enum: FuelType, example: FuelType.GASOLINE })
  fuelType!: FuelType;

  @ApiProperty({ enum: Transmission, example: Transmission.AUTOMATIC })
  transmission!: Transmission;

  @ApiProperty({ example: 'Buenos Aires, Argentina' })
  location!: string;

  @ApiProperty({ type: [String] })
  images!: string[];

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ type: CarSellerDto })
  seller!: CarSellerDto;

  @ApiProperty({ example: '2026-05-18T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-18T12:00:00.000Z' })
  updatedAt!: Date;
}

export class CarsListMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 12 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 4 })
  totalPages!: number;
}

export class CarsListResponseDto {
  @ApiProperty({ type: [CarResponseDto] })
  data!: CarResponseDto[];

  @ApiProperty({ type: CarsListMetaDto })
  meta!: CarsListMetaDto;
}
