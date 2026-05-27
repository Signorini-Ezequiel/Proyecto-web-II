import { Injectable, NotFoundException } from '@nestjs/common';
import { FavoritesRepository } from './favorites.repository';

@Injectable()
export class FavoritesService {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async findByUserId(userId: string): Promise<string[]> {
    return this.favoritesRepository.findByUserId(userId);
  }

  async add(userId: string, carId: string): Promise<{ ok: true; favorites: string[] }> {
    await this.ensureCarExists(carId);
    return { ok: true, favorites: await this.favoritesRepository.add(userId, carId) };
  }

  async remove(userId: string, carId: string): Promise<{ ok: true; favorites: string[] }> {
    return {
      ok: true,
      favorites: await this.favoritesRepository.remove(userId, carId),
    };
  }

  async toggle(
    userId: string,
    carId: string,
  ): Promise<{ ok: true; selected: boolean; favorites: string[] }> {
    await this.ensureCarExists(carId);
    const result = await this.favoritesRepository.toggle(userId, carId);
    return { ok: true, ...result };
  }

  async isFavorite(userId: string, carId: string): Promise<boolean> {
    return this.favoritesRepository.isFavorite(userId, carId);
  }

  async getFavoriteIds(userId: string): Promise<Set<string>> {
    return this.favoritesRepository.findFavoriteIdsSet(userId);
  }

  async getFavoritesCount(carId: string): Promise<number> {
    return this.favoritesRepository.countFavoritesForCar(carId);
  }

  private async ensureCarExists(carId: string): Promise<void> {
    if (!(await this.favoritesRepository.carExists(carId))) {
      throw new NotFoundException('Auto no encontrado.');
    }
  }
}
