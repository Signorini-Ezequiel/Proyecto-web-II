import { Injectable } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { Car } from './entities/car.entity';
import { CarsRepository } from './cars.repository';

@Injectable()
export class CarsService {
  constructor(private readonly carsRepository: CarsRepository) {}

  findAll(filters: FilterCarsDto): Car[] {
    return this.carsRepository.findAll(filters);
  }

  findById(id: string): Car {
    return this.carsRepository.requireById(id);
  }

  create(dto: CreateCarDto): Car {
    return this.carsRepository.create(dto);
  }

  getMakes(): Array<string | number> {
    return this.carsRepository.getUniqueValues('make');
  }
}
