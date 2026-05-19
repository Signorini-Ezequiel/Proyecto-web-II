import { Injectable } from '@nestjs/common';

@Injectable()
export class FavoritesRepository {
  private readonly favoritesByUser = new Map<number, Set<string>>();

  findByUserId(userId: number): string[] {
    return [...(this.favoritesByUser.get(userId) ?? new Set<string>())];
  }

  add(userId: number, carId: string): string[] {
    this.getOrCreate(userId).add(carId);
    return this.findByUserId(userId);
  }

  remove(userId: number, carId: string): string[] {
    this.getOrCreate(userId).delete(carId);
    return this.findByUserId(userId);
  }

  toggle(
    userId: number,
    carId: string,
  ): { selected: boolean; favorites: string[] } {
    const favorites = this.getOrCreate(userId);

    if (favorites.has(carId)) {
      favorites.delete(carId);
      return { selected: false, favorites: this.findByUserId(userId) };
    }

    favorites.add(carId);
    return { selected: true, favorites: this.findByUserId(userId) };
  }

  private getOrCreate(userId: number): Set<string> {
    const existing = this.favoritesByUser.get(userId);

    if (existing) {
      return existing;
    }

    const created = new Set<string>();
    this.favoritesByUser.set(userId, created);
    return created;
  }
}
