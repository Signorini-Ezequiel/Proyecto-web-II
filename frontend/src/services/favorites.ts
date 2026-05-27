import { apiDelete, apiGet, apiPost } from './api';
import { getSessionUser } from './auth';
import { showToast } from '../utils/toast';

type FavoritesListResponse = {
  ok: boolean;
  count: number;
  favorites: string[];
};

type FavoriteActionResponse = {
  ok: boolean;
  selected: boolean;
  favorites: string[];
};

function canUseFavorites(): boolean {
  return getSessionUser()?.role === 'buyer';
}

class FavoritesCache {
  private favoriteIds = new Set<string>();
  private initialized = false;
  private syncRequest: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.syncWithBackend();
  }

  async syncWithBackend(): Promise<void> {
    if (this.syncRequest) return this.syncRequest;

    this.syncRequest = (async () => {
      if (!canUseFavorites()) {
        this.clear();
        return;
      }

      const response = await apiGet<FavoritesListResponse>('favorites');

      if (!Array.isArray(response.favorites)) {
        console.error('Favorites sync returned unexpected payload:', response);
        return;
      }

      this.favoriteIds = new Set(response.favorites);
      this.initialized = true;
    })()
      .catch((error) => {
        console.error('Error syncing favorites with backend:', error);
      })
      .finally(() => {
        this.syncRequest = null;
      });

    return this.syncRequest;
  }

  getAll(): string[] {
    return Array.from(this.favoriteIds);
  }

  has(carId: string): boolean {
    return this.favoriteIds.has(carId);
  }

  addLocal(carId: string): void {
    this.favoriteIds.add(carId);
  }

  removeLocal(carId: string): void {
    this.favoriteIds.delete(carId);
  }

  toggleLocal(carId: string): boolean {
    if (this.favoriteIds.has(carId)) {
      this.favoriteIds.delete(carId);
    } else {
      this.favoriteIds.add(carId);
    }
    return this.favoriteIds.has(carId);
  }

  updateFromBackend(favorites: string[]): void {
    this.favoriteIds = new Set(favorites);
    this.initialized = true;
  }

  clear(): void {
    this.favoriteIds.clear();
    this.initialized = false;
  }
}

const favoritesCache = new FavoritesCache();

export async function getFavorites(): Promise<string[]> {
  if (!canUseFavorites()) return [];

  await favoritesCache.initialize();
  return favoritesCache.getAll();
}

export function isFavorite(carId: string): boolean {
  if (!canUseFavorites()) return false;
  return favoritesCache.has(carId);
}

export async function toggleFavorite(carId: string): Promise<boolean> {
  if (!canUseFavorites()) {
    showToast('Debes estar logueado para guardar favoritos', 'error');
    return isFavorite(carId);
  }

  const wasSelected = isFavorite(carId);
  favoritesCache.toggleLocal(carId);

  try {
    const response = await apiPost<FavoriteActionResponse>(`favorites/toggle/${carId}`);

    if (!Array.isArray(response.favorites)) {
      throw new Error('Invalid favorites payload');
    }

    favoritesCache.updateFromBackend(response.favorites);
    return response.selected;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    if (wasSelected) {
      favoritesCache.addLocal(carId);
    } else {
      favoritesCache.removeLocal(carId);
    }
    showToast('Error al actualizar favorito', 'error');
    return wasSelected;
  }
}

export async function addFavorite(carId: string): Promise<void> {
  if (!canUseFavorites()) {
    showToast('Debes estar logueado para guardar favoritos', 'error');
    return;
  }

  if (isFavorite(carId)) return;

  favoritesCache.addLocal(carId);

  try {
    const response = await apiPost<FavoriteActionResponse>(`favorites/${carId}`);

    if (!Array.isArray(response.favorites)) {
      throw new Error('Invalid favorites payload');
    }

    favoritesCache.updateFromBackend(response.favorites);
  } catch (error) {
    console.error('Error adding favorite:', error);
    favoritesCache.removeLocal(carId);
    showToast('No se pudo guardar el favorito', 'error');
  }
}

export async function removeFavorite(carId: string): Promise<void> {
  if (!canUseFavorites()) return;

  if (!isFavorite(carId)) return;

  favoritesCache.removeLocal(carId);

  try {
    const response = await apiDelete<FavoriteActionResponse>(`favorites/${carId}`);

    if (!Array.isArray(response.favorites)) {
      throw new Error('Invalid favorites payload');
    }

    favoritesCache.updateFromBackend(response.favorites);
  } catch (error) {
    console.error('Error removing favorite:', error);
    favoritesCache.addLocal(carId);
    showToast('No se pudo eliminar el favorito', 'error');
  }
}

export async function syncFavorites(): Promise<void> {
  if (!canUseFavorites()) {
    favoritesCache.clear();
    return;
  }

  await favoritesCache.syncWithBackend();
}

export function clearFavorites(): void {
  favoritesCache.clear();
}

export async function getFavoritesSet(): Promise<Set<string>> {
  const ids = await getFavorites();
  return new Set(ids);
}
