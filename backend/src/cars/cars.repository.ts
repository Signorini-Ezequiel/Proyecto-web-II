import { Injectable, NotFoundException } from '@nestjs/common';
import type { Car as PrismaCar, FuelType, Transmission } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarDto } from './dto/create-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { Car } from './entities/car.entity';

const DEFAULT_SPECS = {
  engine: 'No especificado',
  power: 'No especificada',
  torque: 'No especificado',
  acceleration: 'No especificada',
  topSpeed: 'No especificado',
  consumption: 'No especificado',
  dimensions: 'No especificadas',
  weight: 'No especificado',
  features: [] as string[],
};

const FUEL_TYPE_MAP: Record<string, FuelType> = {
  nafta: 'GASOLINE',
  gasoline: 'GASOLINE',
  diesel: 'DIESEL',
  hibrido: 'HYBRID',
  hybrid: 'HYBRID',
  electrico: 'ELECTRIC',
  electric: 'ELECTRIC',
  gnc: 'CNG',
  cng: 'CNG',
  lpg: 'LPG',
  other: 'OTHER',
  otro: 'OTHER',
};

const TRANSMISSION_MAP: Record<string, Transmission> = {
  manual: 'MANUAL',
  automatica: 'AUTOMATIC',
  automatic: 'AUTOMATIC',
  cvt: 'SEMI_AUTOMATIC',
  semiautomatica: 'SEMI_AUTOMATIC',
  semi_automatic: 'SEMI_AUTOMATIC',
};

@Injectable()
export class CarsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterCarsDto = {}): Promise<Car[]> {
    const where: any = {
      isPublished: true,
    };

    if (filters.make) {
      where.brand = filters.make;
    }

    if (filters.fuel) {
      where.fuelType = this.toFuelType(filters.fuel);
    }

    if (filters.transmission) {
      where.transmission = this.toTransmission(filters.transmission);
    }

    if (filters.location) {
      where.location = filters.location;
    }

    if (filters.minYear !== undefined) {
      where.year = { gte: filters.minYear };
    }

    if (filters.searchQuery) {
      where.OR = [
        { brand: { contains: filters.searchQuery, mode: 'insensitive' } },
        { model: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    const cars = await this.prisma.car.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return cars.map((car) => this.normalizeCar(car));
  }

  async findById(id: string): Promise<Car | undefined> {
    const car = await this.prisma.car.findUnique({ where: { id } });
    return car ? this.normalizeCar(car) : undefined;
  }

  async create(dto: CreateCarDto, sellerId: string): Promise<Car> {
    const created = await this.prisma.car.create({
      data: {
        sellerId,
        title: `${dto.make.trim()} ${dto.model.trim()}`,
        brand: dto.make.trim(),
        model: dto.model.trim(),
        year: dto.year,
        mileage: dto.mileage,
        price: dto.price,
        description: dto.description.trim(),
        color: dto.color.trim(),
        location: dto.location.trim(),
        images: dto.images.map((image) => image.trim()),
        isPublished: false,
        fuelType: this.toFuelType(dto.fuel),
        transmission: this.toTransmission(dto.transmission),
        engine: dto.specs.engine?.trim() || DEFAULT_SPECS.engine,
        power: dto.specs.power?.trim() || DEFAULT_SPECS.power,
        torque: dto.specs.torque?.trim() || DEFAULT_SPECS.torque,
        acceleration: dto.specs.acceleration?.trim() || DEFAULT_SPECS.acceleration,
        topSpeed: dto.specs.topSpeed?.trim() || DEFAULT_SPECS.topSpeed,
        consumption: dto.specs.consumption?.trim() || DEFAULT_SPECS.consumption,
        dimensions: dto.specs.dimensions?.trim() || DEFAULT_SPECS.dimensions,
        weight: dto.specs.weight?.trim() || DEFAULT_SPECS.weight,
        features: Array.isArray(dto.specs.features)
          ? dto.specs.features.map((feature) => feature.trim()).filter(Boolean)
          : DEFAULT_SPECS.features,
      },
    });

    return this.normalizeCar(created);
  }

  async requireById(id: string): Promise<Car> {
    const car = await this.findById(id);

    if (!car) {
      throw new NotFoundException('Auto no encontrado.');
    }

    return car;
  }

  async getUniqueValues(key: keyof Car): Promise<Array<string | number>> {
    const cars = await this.prisma.car.findMany({
      where: { isPublished: true },
    });

    const values = cars
      .map((car) => this.normalizeCar(car)[key])
      .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number');

    return [...new Set(values)].sort();
  }

  private normalizeCar(car: PrismaCar): Car {
    return {
      id: car.id,
      make: car.brand,
      model: car.model,
      year: car.year,
      price: Number(car.price),
      mileage: car.mileage,
      transmission: this.mapTransmission(car.transmission),
      fuel: this.mapFuelLabel(car.fuelType),
      color: car.color,
      location: car.location,
      description: car.description,
      images: car.images ?? [],
      specs: {
        engine: car.engine ?? DEFAULT_SPECS.engine,
        power: car.power ?? DEFAULT_SPECS.power,
        torque: car.torque ?? DEFAULT_SPECS.torque,
        acceleration: car.acceleration ?? DEFAULT_SPECS.acceleration,
        topSpeed: car.topSpeed ?? DEFAULT_SPECS.topSpeed,
        consumption: car.consumption ?? DEFAULT_SPECS.consumption,
        dimensions: car.dimensions ?? DEFAULT_SPECS.dimensions,
        weight: car.weight ?? DEFAULT_SPECS.weight,
        features: car.features ?? [],
      },
    };
  }

  private mapFuelLabel(value: FuelType): string {
    switch (value) {
      case 'GASOLINE':
        return 'Nafta';
      case 'DIESEL':
        return 'Diesel';
      case 'HYBRID':
        return 'Hibrido';
      case 'ELECTRIC':
        return 'Electrico';
      case 'CNG':
        return 'GNC';
      case 'LPG':
        return 'Otro';
      default:
        return 'Otro';
    }
  }

  private toFuelType(value: string): FuelType {
    return FUEL_TYPE_MAP[this.normalizeKey(value)] ?? 'OTHER';
  }

  private mapTransmission(value: Transmission): string {
    switch (value) {
      case 'MANUAL':
        return 'Manual';
      case 'AUTOMATIC':
        return 'Automatica';
      case 'SEMI_AUTOMATIC':
        return 'CVT';
      default:
        return 'CVT';
    }
  }

  private toTransmission(value: string): Transmission {
    return TRANSMISSION_MAP[this.normalizeKey(value)] ?? 'SEMI_AUTOMATIC';
  }

  private normalizeKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }
}
