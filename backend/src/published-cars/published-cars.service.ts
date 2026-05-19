import { Injectable } from '@nestjs/common';
import { CreatePublishedCarDto } from './dto/create-published-car.dto';
import { UpdatePublishedCarDto } from './dto/update-published-car.dto';
import { PublishedCar } from './published-car.entity';
import { PublishedCarsRepository } from './published-cars.repository';

@Injectable()
export class PublishedCarsService {
  constructor(private readonly publishedCarsRepository: PublishedCarsRepository) {}

  findAll(): PublishedCar[] {
    return this.publishedCarsRepository.findAll();
  }

  findById(id: string): PublishedCar {
    return this.publishedCarsRepository.requireById(id);
  }

  findBySellerId(sellerId: number): PublishedCar[] {
    return this.publishedCarsRepository.findBySellerId(sellerId);
  }

  create(dto: CreatePublishedCarDto): PublishedCar {
    return this.publishedCarsRepository.create(dto);
  }

  update(id: string, dto: UpdatePublishedCarDto): PublishedCar {
    return this.publishedCarsRepository.update(id, dto);
  }

  delete(id: string): { ok: true } {
    this.publishedCarsRepository.delete(id);
    return { ok: true };
  }
}
