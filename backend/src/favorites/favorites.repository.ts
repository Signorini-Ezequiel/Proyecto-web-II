import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todos los IDs de autos favoritos de un usuario
   */
  async findByUserId(userId: string): Promise<string[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { carId: true },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map((fav) => fav.carId);
  }

  async carExists(carId: string): Promise<boolean> {
    const car = await this.prisma.car.findFirst({
      where: { id: carId, isPublished: true },
      select: { id: true },
    });

    return !!car;
  }

  /**
   * Agrega un auto a favoritos
   */
  async add(userId: string, carId: string): Promise<string[]> {
    await this.prisma.favorite.upsert({
      where: { userId_carId: { userId, carId } },
      update: {},
      create: { userId, carId },
    });
    return this.findByUserId(userId);
  }

  /**
   * Elimina un auto de favoritos
   */
  async remove(userId: string, carId: string): Promise<string[]> {
    await this.prisma.favorite.deleteMany({
      where: { userId, carId },
    });
    return this.findByUserId(userId);
  }

  /**
   * Alterna el estado de favorito (add/remove)
   */
  async toggle(
    userId: string,
    carId: string,
  ): Promise<{ selected: boolean; favorites: string[] }> {
    const existing = await this.prisma.favorite.findFirst({
      where: { userId, carId },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { selected: false, favorites: await this.findByUserId(userId) };
    }

    await this.prisma.favorite.create({
      data: { userId, carId },
    });
    return { selected: true, favorites: await this.findByUserId(userId) };
  }

  /**
   * Verifica si un auto está en favoritos
   */
  async isFavorite(userId: string, carId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_carId: { userId, carId } },
    });
    return !!favorite;
  }

  /**
   * Obtiene el contador de favoritos de un auto
   */
  async countFavoritesForCar(carId: string): Promise<number> {
    return this.prisma.favorite.count({
      where: { carId },
    });
  }

  /**
   * Obtiene IDs de todos los favoritos de un usuario (optimizado para Set)
   */
  async findFavoriteIdsSet(userId: string): Promise<Set<string>> {
    const ids = await this.findByUserId(userId);
    return new Set(ids);
  }
}
