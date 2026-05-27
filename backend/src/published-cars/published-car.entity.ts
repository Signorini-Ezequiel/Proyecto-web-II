import { Car } from '../cars/entities/car.entity';

export interface PublishedCar extends Car {
  sellerId: string;
  seller?: {
    id: string;
    name: string;
    role: 'buyer' | 'seller';
    avatarUrl: string | null;
  };
  publishedAt: string;
  updatedAt: string;
}
