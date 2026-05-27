import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Car as PrismaCar, FuelType, Transmission } from '@prisma/client';
import type { UserRole as PrismaUserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublishedCarDto } from './dto/create-published-car.dto';
import { UpdatePublishedCarDto } from './dto/update-published-car.dto';
import { PublishedCar } from './published-car.entity';

const MAX_IMAGES = 10;
const DEFAULT_SPECS = {
  engine: 'No especificado',
  power: 'No especificada',
  torque: 'No especificado',
  acceleration: 'No especificado',
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
export class PublishedCarsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PublishedCar[]> {
    const cars = await this.prisma.car.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    const sellers = await this.getSellerMap(cars.map((car) => car.sellerId));
    return cars.map((car) => this.normalizeCar(car, sellers.get(car.sellerId)));
  }

  async findById(id: string): Promise<PublishedCar | undefined> {
    const car = await this.prisma.car.findUnique({ where: { id } });
    if (!car) return undefined;

    const seller = await this.prisma.user.findUnique({
      where: { id: car.sellerId },
      select: { id: true, name: true, role: true, avatar: true },
    });

    return this.normalizeCar(car, seller ?? undefined);
  }

  async findBySellerId(sellerId: string): Promise<PublishedCar[]> {
    const cars = await this.prisma.car.findMany({
      where: { sellerId, isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    const sellers = await this.getSellerMap(cars.map((car) => car.sellerId));
    return cars.map((car) => this.normalizeCar(car, sellers.get(car.sellerId)));
  }

  async create(dto: CreatePublishedCarDto): Promise<PublishedCar> {
    const images = this.validateImages(dto.images);
    const specs = this.normalizeSpecs(dto.specs);
    const brand = dto.make.trim();
    const model = dto.model.trim();

    const car = await this.prisma.car.create({
      data: {
        sellerId: dto.sellerId,
        title: `${brand} ${model}`,
        brand,
        model,
        year: dto.year,
        mileage: dto.mileage,
        price: dto.price,
        description: dto.description.trim(),
        color: dto.color?.trim() || 'No especificado',
        engine: specs.engine,
        power: specs.power,
        torque: specs.torque,
        acceleration: specs.acceleration,
        topSpeed: specs.topSpeed,
        consumption: specs.consumption,
        dimensions: specs.dimensions,
        weight: specs.weight,
        features: specs.features,
        fuelType: this.toFuelType(dto.fuel),
        transmission: this.toTransmission(dto.transmission),
        location: dto.location.trim(),
        images,
        isPublished: true,
      },
    });

    return this.normalizeCar(car);
  }

  async update(id: string, dto: UpdatePublishedCarDto): Promise<PublishedCar> {
    const current = await this.requireById(id);
    const specs = dto.specs ? this.normalizeSpecs(dto.specs) : current.specs;
    const images =
      dto.images === undefined ? current.images : this.validateImages(dto.images);
    const brand = dto.make?.trim() || current.make;
    const model = dto.model?.trim() || current.model;

    const updated = await this.prisma.car.update({
      where: { id },
      data: {
        title: `${brand} ${model}`,
        brand,
        model,
        year: dto.year ?? current.year,
        mileage: dto.mileage ?? current.mileage,
        price: dto.price ?? current.price,
        description: dto.description?.trim() ?? current.description,
        color: dto.color?.trim() ?? current.color,
        location: dto.location?.trim() ?? current.location,
        images,
        fuelType: dto.fuel
          ? this.toFuelType(dto.fuel)
          : this.toFuelType(current.fuel),
        transmission: dto.transmission
          ? this.toTransmission(dto.transmission)
          : this.toTransmission(current.transmission),
        engine: specs.engine,
        power: specs.power,
        torque: specs.torque,
        acceleration: specs.acceleration,
        topSpeed: specs.topSpeed,
        consumption: specs.consumption,
        dimensions: specs.dimensions,
        weight: specs.weight,
        features: specs.features,
        sellerId: dto.sellerId ?? current.sellerId,
      },
    });

    return this.normalizeCar(updated);
  }

  async delete(id: string): Promise<void> {
    await this.requireById(id);

    await this.prisma.$transaction([
      this.prisma.favorite.deleteMany({ where: { carId: id } }),
      this.prisma.comparisonCar.deleteMany({ where: { carId: id } }),
      this.prisma.questionMessage.deleteMany({ where: { carId: id } }),
      this.prisma.questionThread.deleteMany({ where: { carId: id } }),
      this.prisma.question.deleteMany({ where: { carId: id } }),
      this.prisma.aIAnalysis.deleteMany({ where: { carId: id } }),
      this.prisma.imageAnalysis.deleteMany({ where: { carId: id } }),
      this.prisma.car.delete({ where: { id } }),
    ]);
  }

  async requireById(id: string): Promise<PublishedCar> {
    const car = await this.findById(id);

    if (!car) {
      throw new NotFoundException('Publicacion no encontrada.');
    }

    return car;
  }

  private normalizeCar(
    car: PrismaCar,
    seller?: {
      id: string;
      name: string;
      role: PrismaUserRole;
      avatar: string | null;
    },
  ): PublishedCar {
    return {
      id: car.id,
      make: car.brand,
      model: car.model,
      year: car.year,
      price: Number(car.price),
      mileage: car.mileage,
      transmission: car.transmission,
      fuel: this.mapFuelLabel(car.fuelType),
      color: car.color ?? 'No especificado',
      location: car.location,
      description: car.description,
      images: car.images ?? [],
      sellerId: car.sellerId,
      seller: seller
        ? {
            id: seller.id,
            name: seller.name,
            role: seller.role === 'SELLER' ? 'seller' : 'buyer',
            avatarUrl: seller.avatar,
          }
        : undefined,
      publishedAt: car.createdAt.toISOString(),
      updatedAt: car.updatedAt.toISOString(),
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

  private async getSellerMap(
    sellerIds: string[],
  ): Promise<
    Map<
      string,
      { id: string; name: string; role: PrismaUserRole; avatar: string | null }
    >
  > {
    const uniqueIds = Array.from(new Set(sellerIds.filter((id) => this.isUuid(id))));
    if (uniqueIds.length === 0) return new Map();

    const sellers = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true, role: true, avatar: true },
    });

    return new Map(sellers.map((seller) => [seller.id, seller]));
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private mapFuelLabel(value: string): string {
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
      default:
        return 'Otro';
    }
  }

  private toFuelType(value: string): FuelType {
    return FUEL_TYPE_MAP[this.normalizeKey(value)] ?? 'OTHER';
  }

  private toTransmission(value: string): Transmission {
    return TRANSMISSION_MAP[this.normalizeKey(value)] ?? 'SEMI_AUTOMATIC';
  }

  private validateImages(images: string[] | undefined): string[] {
    if (!Array.isArray(images)) {
      throw new BadRequestException('Debe incluir al menos una imagen.');
    }

    const normalizedImages = images
      .map((image) => (typeof image === 'string' ? image.trim() : ''))
      .filter(Boolean);

    if (normalizedImages.length === 0) {
      throw new BadRequestException('Debe incluir al menos una imagen.');
    }

    if (normalizedImages.length > MAX_IMAGES) {
      throw new BadRequestException(
        `Solo se permiten hasta ${MAX_IMAGES} imagenes.`,
      );
    }

    return normalizedImages;
  }

  private normalizeSpecs(
    specs: Partial<CreatePublishedCarDto['specs']> | undefined,
  ): CreatePublishedCarDto['specs'] {
    return {
      engine: specs?.engine?.trim() || DEFAULT_SPECS.engine,
      power: specs?.power?.trim() || DEFAULT_SPECS.power,
      torque: specs?.torque?.trim() || DEFAULT_SPECS.torque,
      acceleration: specs?.acceleration?.trim() || DEFAULT_SPECS.acceleration,
      topSpeed: specs?.topSpeed?.trim() || DEFAULT_SPECS.topSpeed,
      consumption: specs?.consumption?.trim() || DEFAULT_SPECS.consumption,
      dimensions: specs?.dimensions?.trim() || DEFAULT_SPECS.dimensions,
      weight: specs?.weight?.trim() || DEFAULT_SPECS.weight,
      features: Array.isArray(specs?.features)
        ? specs.features.map((feature) => feature.trim()).filter(Boolean)
        : DEFAULT_SPECS.features,
    };
  }

  private normalizeKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }
}
