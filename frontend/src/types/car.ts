export type FuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "ELECTRIC" | "LPG" | "CNG" | "OTHER";
export type Transmission = "MANUAL" | "AUTOMATIC" | "SEMI_AUTOMATIC";

export type FuelLabel = "Nafta" | "Diesel" | "Hibrido" | "Electrico" | "GNC" | "Otro";
export type TransmissionLabel = "Manual" | "Automatica" | "CVT";

export interface CarSpecsDto {
  engine: string;
  power: string;
  torque: string;
  acceleration: string;
  topSpeed: string;
  consumption: string;
  dimensions: string;
  weight: string;
  features: string[];
}

export interface CarDto {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  fuel: string;
  color: string;
  location: string;
  description: string;
  images: string[];
  specs: CarSpecsDto;
}

export interface CreateCarDto {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  fuel: string;
  color: string;
  location: string;
  description: string;
  images: string[];
  specs: CarSpecsDto;
}

export type UpdateCarDto = Partial<CreateCarDto> & {
  isPublished?: boolean;
};

export interface PublishedCarDto extends CarDto {
  sellerId: string;
  seller?: {
    id: string;
    name: string;
    role: "buyer" | "seller";
    avatarUrl: string | null;
  };
  publishedAt: string;
  updatedAt: string;
}

export type CreatePublishedCarDto = CreateCarDto & {
  sellerId: string;
};

export type UpdatePublishedCarDto = Partial<CreatePublishedCarDto>;

export interface PrismaCarResponseDto {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: string;
  description: string;
  horsepower: number | null;
  fuelType: FuelType;
  transmission: Transmission;
  location: string;
  images: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FindCarsQueryDto {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FilterCarsDto {
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  fuel?: string;
  transmission?: string;
  location?: string;
  minYear?: number;
  searchQuery?: string;
}

export type Car = CarDto;
export type CarSpecs = CarSpecsDto;
