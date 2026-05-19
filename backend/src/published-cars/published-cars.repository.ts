import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePublishedCarDto } from './dto/create-published-car.dto';
import { UpdatePublishedCarDto } from './dto/update-published-car.dto';
import { PublishedCar } from './published-car.entity';

@Injectable()
export class PublishedCarsRepository {
  private readonly publishedCars = new Map<string, PublishedCar>();

  findAll(): PublishedCar[] {
    return [...this.publishedCars.values()];
  }

  findById(id: string): PublishedCar | undefined {
    return this.publishedCars.get(id);
  }

  findBySellerId(sellerId: number): PublishedCar[] {
    return this.findAll().filter((car) => car.sellerId === sellerId);
  }

  create(dto: CreatePublishedCarDto): PublishedCar {
    const now = new Date().toISOString();
    const car: PublishedCar = {
      id: `published_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      ...dto,
      publishedAt: now,
      updatedAt: now,
    };

    this.publishedCars.set(car.id, car);
    return car;
  }

  update(id: string, dto: UpdatePublishedCarDto): PublishedCar {
    const current = this.requireById(id);
    const updated: PublishedCar = {
      ...current,
      ...dto,
      specs: dto.specs ?? current.specs,
      updatedAt: new Date().toISOString(),
    };

    this.publishedCars.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    const deleted = this.publishedCars.delete(id);

    if (!deleted) {
      throw new NotFoundException('Publicacion no encontrada.');
    }
  }

  requireById(id: string): PublishedCar {
    const car = this.findById(id);

    if (!car) {
      throw new NotFoundException('Publicacion no encontrada.');
    }

    return car;
  }
}
