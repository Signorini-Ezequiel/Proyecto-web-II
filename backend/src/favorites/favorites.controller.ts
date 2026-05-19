import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FavoriteDto } from './dto/favorite.dto';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get(':userId')
  @ApiOkResponse({ description: 'Lista favoritos de un usuario.' })
  findByUserId(@Param('userId', ParseIntPipe) userId: number): string[] {
    return this.favoritesService.findByUserId(userId);
  }

  @Post(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Agrega un favorito.' })
  add(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: FavoriteDto,
  ): { ok: true; favorites: string[] } {
    return this.favoritesService.add(userId, dto.carId);
  }

  @Post(':userId/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Alterna un favorito.' })
  toggle(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: FavoriteDto,
  ): { ok: true; selected: boolean; favorites: string[] } {
    return this.favoritesService.toggle(userId, dto.carId);
  }

  @Delete(':userId/:carId')
  @ApiOkResponse({ description: 'Elimina un favorito.' })
  remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('carId') carId: string,
  ): { ok: true; favorites: string[] } {
    return this.favoritesService.remove(userId, carId);
  }
}
