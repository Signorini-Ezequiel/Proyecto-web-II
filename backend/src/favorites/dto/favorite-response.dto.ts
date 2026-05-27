import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: true })
  selected: boolean;

  @ApiProperty({ example: ['uuid-1', 'uuid-2', 'uuid-3'], type: [String] })
  favorites: string[];
}

export class FavoriteListResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: 5 })
  count: number;

  @ApiProperty({ example: ['uuid-1', 'uuid-2', 'uuid-3'], type: [String] })
  favorites: string[];
}

export class FavoriteCheckResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: true })
  isFavorite: boolean;
}
