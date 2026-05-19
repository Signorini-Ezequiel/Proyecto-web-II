import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublishedCarDto } from './dto/create-published-car.dto';
import { UpdatePublishedCarDto } from './dto/update-published-car.dto';
import { PublishedCar } from './published-car.entity';

const MAX_IMAGES = 10;

const FUEL_TYPE_MAP: Record<string, 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'CNG' | 'OTHER'> = {
  Nafta: 'GASOLINE',
  Diesel: 'DIESEL',
  Híbrido: 'HYBRID',
  Eléctrico: 'ELECTRIC',
  GNC: 'CNG',
};

const TRANSMISSION_MAP: Record<string, 'MANUAL' | 'AUTOMATIC' | 'SEMI_AUTOMATIC'> = {
  Manual: 'MANUAL',
  Automática: 'AUTOMATIC',
  CVT: 'SEMI_AUTOMATIC',
};

@Injectable()
export class PublishedCarsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PublishedCar[]> {
    const cars = await this.prisma.car.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    return cars.map(this.normalizeCar);
  }

  async findById(id: string): Promise<PublishedCar | undefined> {
    const car = await this.prisma.car.findUnique({ where: { id } });
    return car ? this.normalizeCar(car) : undefined;
  }

  async findBySellerId(sellerId: number): Promise<PublishedCar[]> {
    const cars = await this.prisma.car.findMany({
      where: { sellerId: sellerId.toString(), isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    return cars.map(this.normalizeCar);
  }

  async create(dto: CreatePublishedCarDto): Promise<PublishedCar> {
    if (dto.images.length === 0) {
      throw new BadRequestException('Debe incluir al menos una imagen.');
    }

    if (dto.images.length > MAX_IMAGES) {
      throw new BadRequestException(`Solo se permiten hasta ${MAX_IMAGES} imágenes.`);
    }

    const car = await this.prisma.car.create({
      data: {
        sellerId: dto.sellerId.toString(),
        title: `${dto.make} ${dto.model}`,
        brand: dto.make,
        model: dto.model,
        year: dto.year,
        mileage: dto.mileage,
        price: dto.price,
        description: dto.description,
        engine: dto.specs.engine,
        power: dto.specs.power,
        torque: dto.specs.torque,
        acceleration: dto.specs.acceleration,
        topSpeed: dto.specs.topSpeed,
        consumption: dto.specs.consumption,
        dimensions: dto.specs.dimensions,
        weight: dto.specs.weight,
        features: dto.specs.features,
        fuelType: FUEL_TYPE_MAP[dto.fuel] ?? 'OTHER',
        transmission: TRANSMISSION_MAP[dto.transmission] ?? 'SEMI_AUTOMATIC',
        location: dto.location,
        images: dto.images,
        isPublished: true,
      },
    });

    return this.normalizeCar(car);
  }

  async update(id: string, dto: UpdatePublishedCarDto): Promise<PublishedCar> {
    const current = await this.requireById(id);

    const data: Record<string, unknown> = {
      title: dto.make || current.make + ' ' + current.model,
      brand: dto.make ?? current.make,
      model: dto.model ?? current.model,
      year: dto.year ?? current.year,
      mileage: dto.mileage ?? current.mileage,
      price: dto.price ?? current.price,
      description: dto.description ?? current.description,
      location: dto.location ?? current.location,
      images: dto.images ?? current.images,
      fuelType: dto.fuel ? FUEL_TYPE_MAP[dto.fuel] ?? 'OTHER' : current.fuel as any,
      transmission: dto.transmission ? TRANSMISSION_MAP[dto.transmission] ?? 'SEMI_AUTOMATIC' : current.transmission as any,
      engine: dto.specs?.engine ?? current.specs.engine,
      power: dto.specs?.power ?? current.specs.power,
      torque: dto.specs?.torque ?? current.specs.torque,
      acceleration: dto.specs?.acceleration ?? current.specs.acceleration,
      topSpeed: dto.specs?.topSpeed ?? current.specs.topSpeed,
      consumption: dto.specs?.consumption ?? current.specs.consumption,
      dimensions: dto.specs?.dimensions ?? current.specs.dimensions,
      weight: dto.specs?.weight ?? current.specs.weight,
      features: dto.specs?.features ?? current.specs.features,
    };

    const updated = await this.prisma.car.update({
      where: { id },
      data,
    });

    return this.normalizeCar(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.car.delete({ where: { id } });
  }

  async requireById(id: string): Promise<PublishedCar> {
    const car = await this.findById(id);

    if (!car) {
      throw new NotFoundException('Publicacion no encontrada.');
    }

    return car;
  }

  private normalizeCar(car: any): PublishedCar {
    return {
      id: car.id,
      make: car.brand,
      model: car.model,
      year: car.year,
      price: Number(car.price),
      mileage: car.mileage,
      transmission: car.transmission,
      fuel: this.mapFuelLabel(car.fuelType),
      color: car.color,
      location: car.location,
      description: car.description,
      images: car.images,
      sellerId: Number(car.sellerId),
      publishedAt: car.createdAt.toISOString(),
      updatedAt: car.updatedAt.toISOString(),
      specs: {
        engine: car.engine ?? 'No especificado',
        power: car.power ?? 'No especificada',
        torque: car.torque ?? 'No especificado',
        acceleration: car.acceleration ?? 'No especificado',
        topSpeed: car.topSpeed ?? 'No especificado',
        consumption: car.consumption ?? 'No especificado',
        dimensions: car.dimensions ?? 'No especificadas',
        weight: car.weight ?? 'No especificado',
        features: car.features ?? [],
      },
    };
  }

  private mapFuelLabel(value: string): string {
    switch (value) {
      case 'GASOLINE':
        return 'Nafta';
      case 'DIESEL':
        return 'Diesel';
      case 'HYBRID':
        return 'Híbrido';
      case 'ELECTRIC':
        return 'Eléctrico';
      case 'CNG':
        return 'GNC';
      default:
        return 'Otro';
    }
  }
}
