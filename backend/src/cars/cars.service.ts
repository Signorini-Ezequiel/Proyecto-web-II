import { Injectable } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { Car } from './entities/car.entity';
import { CarsRepository } from './cars.repository';

@Injectable()
export class CarsService {
  constructor(private readonly carsRepository: CarsRepository) {}

  async findAll(filters: FilterCarsDto): Promise<Car[]> {
    return this.carsRepository.findAll(filters);
  }

  async findById(id: string): Promise<Car> {
    return this.carsRepository.requireById(id);
  }

  async create(dto: CreateCarDto, sellerId: string): Promise<Car> {
    return this.carsRepository.create(dto, sellerId);
  }

  async getMakes(): Promise<Array<string | number>> {
    return this.carsRepository.getUniqueValues('make');
  }
}
