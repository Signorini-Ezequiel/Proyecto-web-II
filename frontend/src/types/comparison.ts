export interface ComparisonCarDto {
  carId: string;
}

export interface ComparisonResponseDto {
  id: string;
  carIds: string[];
}

export interface FavoriteDto {
  carId: string;
}

export interface FavoritesResponseDto {
  ok: true;
  favorites: string[];
}

export interface ToggleFavoriteResponseDto extends FavoritesResponseDto {
  selected: boolean;
}
