import { Injectable } from '@nestjs/common';
import { FavoritesRepository } from './favorites.repository';

@Injectable()
export class FavoritesService {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  findByUserId(userId: number): string[] {
    return this.favoritesRepository.findByUserId(userId);
  }

  add(userId: number, carId: string): { ok: true; favorites: string[] } {
    return { ok: true, favorites: this.favoritesRepository.add(userId, carId) };
  }

  remove(userId: number, carId: string): { ok: true; favorites: string[] } {
    return {
      ok: true,
      favorites: this.favoritesRepository.remove(userId, carId),
    };
  }

  toggle(
    userId: number,
    carId: string,
  ): { ok: true; selected: boolean; favorites: string[] } {
    const result = this.favoritesRepository.toggle(userId, carId);
    return { ok: true, ...result };
  }
}
