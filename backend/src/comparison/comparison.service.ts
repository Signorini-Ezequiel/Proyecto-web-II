import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MAX_COMPARISON_CARS } from '../common/constants/comparison.constants';
import { ComparisonRepository } from './comparison.repository';

@Injectable()
export class ComparisonService {
  constructor(private readonly comparisonRepository: ComparisonRepository) {}

  async getByUserId(userId: string): Promise<{ id: string; carIds: string[] }> {
    const comparison = await this.comparisonRepository.findByUserId(userId);

    if (!comparison) {
      return this.comparisonRepository.create(userId);
    }

    return {
      id: comparison.id,
      carIds: comparison.cars.map((item) => item.carId),
    };
  }

  async create(userId: string): Promise<{ id: string; carIds: string[] }> {
    return this.comparisonRepository.create(userId);
  }

  async addCar(
    comparisonId: string,
    userId: string,
    carId: string,
  ): Promise<{ id: string; carIds: string[] }> {
    const comparison = await this.comparisonRepository.findById(comparisonId);

    if (!comparison) {
      throw new NotFoundException('Comparacion no encontrada.');
    }

    if (comparison.userId !== userId) {
      throw new ForbiddenException('No puedes modificar esta comparacion.');
    }

    if (comparison.cars.some((item) => item.carId === carId)) {
      return {
        id: comparison.id,
        carIds: comparison.cars.map((item) => item.carId),
      };
    }

    if (comparison.cars.length >= MAX_COMPARISON_CARS) {
      throw new BadRequestException('Solo se pueden comparar hasta 4 autos.');
    }

    return this.comparisonRepository.addCar(comparisonId, carId);
  }

  async removeCar(
    comparisonId: string,
    userId: string,
    carId: string,
  ): Promise<{ id: string; carIds: string[] }> {
    const comparison = await this.comparisonRepository.findById(comparisonId);

    if (!comparison) {
      throw new NotFoundException('Comparacion no encontrada.');
    }

    if (comparison.userId !== userId) {
      throw new ForbiddenException('No puedes modificar esta comparacion.');
    }

    return this.comparisonRepository.removeCar(comparisonId, carId);
  }
}
