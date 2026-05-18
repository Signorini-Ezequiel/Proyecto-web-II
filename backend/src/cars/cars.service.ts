import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';

import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import type {
  CarResponseDto,
  CarsListResponseDto,
} from './dto/car-response.dto';
import type { FindCarsQueryDto } from './dto/find-cars-query.dto';

const CAR_WITH_SELLER_SELECT = {
  id: true,
  title: true,
  brand: true,
  model: true,
  year: true,
  mileage: true,
  price: true,
  description: true,
  horsepower: true,
  fuelType: true,
  transmission: true,
  location: true,
  images: true,
  isPublished: true,
  sellerId: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  seller: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
    },
  },
} as const;

type CarWithSeller = Prisma.CarGetPayload<{
  select: typeof CAR_WITH_SELLER_SELECT;
}>;

@Injectable()
export class CarsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createCarDto: CreateCarDto,
    seller: AuthUser,
  ): Promise<CarResponseDto> {
    if (seller.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can create cars');
    }

    const car = await this.prisma.car.create({
      data: {
        ...createCarDto,
        sellerId: seller.id,
      },
      select: CAR_WITH_SELLER_SELECT,
    });

    return this.toCarResponse(car);
  }

  async findAll(query: FindCarsQueryDto): Promise<CarsListResponseDto> {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where = this.buildPublicWhere(query);
    const [cars, total] = await this.prisma.$transaction([
      this.prisma.car.findMany({
        where,
        select: CAR_WITH_SELLER_SELECT,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.car.count({ where }),
    ]);

    return {
      data: cars.map((car) => this.toCarResponse(car)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<CarResponseDto> {
    const car = await this.prisma.car.findFirst({
      where: {
        id,
        isPublished: true,
        deletedAt: null,
      },
      select: CAR_WITH_SELLER_SELECT,
    });

    if (car === null) {
      throw new NotFoundException('Car not found');
    }

    return this.toCarResponse(car);
  }

  async update(
    id: string,
    updateCarDto: UpdateCarDto,
    user: AuthUser,
  ): Promise<CarResponseDto> {
    const existingCar = await this.findExistingCarForMutation(id);

    this.assertCanMutate(existingCar, user);

    const car = await this.prisma.car.update({
      where: { id },
      data: updateCarDto,
      select: CAR_WITH_SELLER_SELECT,
    });

    return this.toCarResponse(car);
  }

  async remove(id: string, user: AuthUser): Promise<CarResponseDto> {
    const existingCar = await this.findExistingCarForMutation(id);

    this.assertCanMutate(existingCar, user);

    const car = await this.prisma.car.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isPublished: false,
      },
      select: CAR_WITH_SELLER_SELECT,
    });

    return this.toCarResponse(car);
  }

  private buildPublicWhere(query: FindCarsQueryDto): Prisma.CarWhereInput {
    const priceFilter: Prisma.DecimalFilter = {};
    const andFilters: Prisma.CarWhereInput[] = [];

    if (query.minPrice !== undefined) {
      priceFilter.gte = query.minPrice;
    }

    if (query.maxPrice !== undefined) {
      priceFilter.lte = query.maxPrice;
    }

    if (query.search !== undefined && query.search.trim().length > 0) {
      const search = query.search.trim();

      andFilters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return {
      isPublished: true,
      deletedAt: null,
      ...(query.brand !== undefined && query.brand.trim().length > 0
        ? { brand: { contains: query.brand.trim(), mode: 'insensitive' } }
        : {}),
      ...(Object.keys(priceFilter).length > 0 ? { price: priceFilter } : {}),
      ...(query.fuelType !== undefined ? { fuelType: query.fuelType } : {}),
      ...(query.transmission !== undefined
        ? { transmission: query.transmission }
        : {}),
      ...(query.location !== undefined && query.location.trim().length > 0
        ? {
            location: {
              contains: query.location.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(andFilters.length > 0 ? { AND: andFilters } : {}),
    };
  }

  private async findExistingCarForMutation(id: string): Promise<CarWithSeller> {
    const car = await this.prisma.car.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: CAR_WITH_SELLER_SELECT,
    });

    if (car === null) {
      throw new NotFoundException('Car not found');
    }

    return car;
  }

  private assertCanMutate(car: CarWithSeller, user: AuthUser): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role !== UserRole.SELLER || car.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller owner or admin can mutate this car');
    }
  }

  private toCarResponse(car: CarWithSeller): CarResponseDto {
    return {
      id: car.id,
      title: car.title,
      brand: car.brand,
      model: car.model,
      year: car.year,
      mileage: car.mileage,
      price: car.price.toString(),
      description: car.description,
      horsepower: car.horsepower,
      fuelType: car.fuelType,
      transmission: car.transmission,
      location: car.location,
      images: car.images,
      isPublished: car.isPublished,
      seller: car.seller,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    };
  }
}
