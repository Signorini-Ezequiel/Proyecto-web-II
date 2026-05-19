import { Injectable } from '@nestjs/common';
import { CreatePublishedCarDto } from './dto/create-published-car.dto';
import { UpdatePublishedCarDto } from './dto/update-published-car.dto';
import { PublishedCar } from './published-car.entity';
import { PublishedCarsRepository } from './published-cars.repository';

@Injectable()
export class PublishedCarsService {
  constructor(
    private readonly publishedCarsRepository: PublishedCarsRepository,
  ) {}

  async findAll(): Promise<PublishedCar[]> {
    return this.publishedCarsRepository.findAll();
  }

  async findById(id: string): Promise<PublishedCar> {
    return this.publishedCarsRepository.requireById(id);
  }

  async findBySellerId(sellerId: number): Promise<PublishedCar[]> {
    return this.publishedCarsRepository.findBySellerId(sellerId);
  }

  async create(dto: CreatePublishedCarDto): Promise<PublishedCar> {
    return this.publishedCarsRepository.create(dto);
  }

  async update(id: string, dto: UpdatePublishedCarDto): Promise<PublishedCar> {
    return this.publishedCarsRepository.update(id, dto);
  }

  async delete(id: string): Promise<{ ok: true }> {
    await this.publishedCarsRepository.delete(id);
    return { ok: true };
  }
}
