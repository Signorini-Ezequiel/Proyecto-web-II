import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { UserRole } from '../common/types/user-role';
import { FavoriteDto } from './dto/favorite.dto';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * Obtiene todos los IDs de autos favoritos del usuario autenticado
   * GET /favorites
   */
  @Get()
  @ApiOkResponse({ description: 'Lista favoritos del usuario autenticado.' })
  async findByUser(@Req() request: AuthenticatedRequest): Promise<{
    ok: boolean;
    count: number;
    favorites: string[];
  }> {
    this.ensureBuyerPermissions(request);
    const userId = request.user.sub;
    const favorites = await this.favoritesService.findByUserId(userId);
    return {
      ok: true,
      count: favorites.length,
      favorites,
    };
  }

  /**
   * Alterna favorito de un auto (add/remove)
   * POST /favorites/toggle/:carId
   */
  @Post('toggle/:carId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Alterna un favorito.' })
  async toggle(
    @Param('carId') carId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{
    ok: boolean;
    selected: boolean;
    favorites: string[];
  }> {
    this.ensureBuyerPermissions(request);
    const userId = request.user.sub;
    const result = await this.favoritesService.toggle(userId, carId);
    return result;
  }

  /**
   * Agrega un auto a favoritos
   * POST /favorites/:carId
   */
  @Post(':carId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Agrega un favorito.' })
  async add(
    @Param('carId') carId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{
    ok: boolean;
    selected: boolean;
    favorites: string[];
  }> {
    this.ensureBuyerPermissions(request);
    const userId = request.user.sub;
    const favorites = await this.favoritesService.add(userId, carId);
    return {
      ...favorites,
      selected: true,
    };
  }

  /**
   * Elimina un auto de favoritos
   * DELETE /favorites/:carId
   */
  @Delete(':carId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Elimina un favorito.' })
  async remove(
    @Param('carId') carId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{
    ok: boolean;
    selected: boolean;
    favorites: string[];
  }> {
    this.ensureBuyerPermissions(request);
    const userId = request.user.sub;
    const favorites = await this.favoritesService.remove(userId, carId);
    return {
      ...favorites,
      selected: false,
    };
  }

  /**
   * Verifica si un auto está en favoritos
   * GET /favorites/check/:carId
   */
  @Get('check/:carId')
  @ApiOkResponse({ description: 'Verifica si un auto está en favoritos.' })
  async isFavorite(
    @Param('carId') carId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{
    ok: boolean;
    isFavorite: boolean;
  }> {
    this.ensureBuyerPermissions(request);
    const userId = request.user.sub;
    const isFavorite = await this.favoritesService.isFavorite(userId, carId);
    return {
      ok: true,
      isFavorite,
    };
  }

  private ensureBuyerPermissions(request: AuthenticatedRequest): void {
    if (request.user.role !== UserRole.Buyer) {
      throw new ForbiddenException(
        'Solo los compradores pueden gestionar favoritos.',
      );
    }
  }
}
