import { Car } from '../cars/entities/car.entity';

export interface PublishedCar extends Car {
  sellerId: number;
  publishedAt: string;
  updatedAt: string;
}
