// Servicio para manejar favoritos
const FAVORITES_KEY = "autopoint_favorites";

export function getFavorites(): string[] {
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function isFavorite(carId: string): boolean {
  return getFavorites().includes(carId);
}

export function toggleFavorite(carId: string): boolean {
  const favorites = getFavorites();
  const index = favorites.indexOf(carId);

  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(carId);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return !isFavorite(carId);
}

export function addFavorite(carId: string): void {
  const favorites = getFavorites();
  if (!favorites.includes(carId)) {
    favorites.push(carId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(carId: string): void {
  const favorites = getFavorites();
  const index = favorites.indexOf(carId);
  if (index > -1) {
    favorites.splice(index, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}
