import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComparisonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.comparison.findFirst({
      where: { userId },
      include: { cars: true },
    });
  }

  async findById(id: string) {
    return this.prisma.comparison.findUnique({
      where: { id },
      include: { cars: true },
    });
  }

  async carExists(carId: string): Promise<boolean> {
    const car = await this.prisma.car.findFirst({
      where: { id: carId, isPublished: true },
      select: { id: true },
    });

    return !!car;
  }

  async create(userId: string): Promise<{ id: string; carIds: string[] }> {
    const comparison = await this.prisma.comparison.create({
      data: { userId },
      include: { cars: true },
    });

    return {
      id: comparison.id,
      carIds: comparison.cars.map((item) => item.carId),
    };
  }

  async addCar(
    comparisonId: string,
    carId: string,
  ): Promise<{ id: string; carIds: string[] }> {
    await this.prisma.comparisonCar.create({
      data: {
        comparisonId,
        carId,
      },
    });

    const comparison = await this.findById(comparisonId);

    return {
      id: comparison!.id,
      carIds: comparison!.cars.map((item) => item.carId),
    };
  }

  async removeCar(
    comparisonId: string,
    carId: string,
  ): Promise<{ id: string; carIds: string[] }> {
    await this.prisma.comparisonCar.delete({
      where: {
        comparisonId_carId: {
          comparisonId,
          carId,
        },
      },
    });

    const comparison = await this.findById(comparisonId);

    return {
      id: comparison!.id,
      carIds: comparison?.cars.map((item) => item.carId) ?? [],
    };
  }
}
