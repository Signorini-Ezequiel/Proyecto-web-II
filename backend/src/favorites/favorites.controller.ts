import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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

  @Get(':userId')
  @ApiOkResponse({ description: 'Lista favoritos de un usuario.' })
  findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AuthenticatedRequest,
  ): string[] {
    this.ensureBuyerOwnsResource(userId, request);
    return this.favoritesService.findByUserId(userId);
  }

  @Post(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Agrega un favorito.' })
  add(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: FavoriteDto,
    @Req() request: AuthenticatedRequest,
  ): { ok: true; favorites: string[] } {
    this.ensureBuyerOwnsResource(userId, request);
    return this.favoritesService.add(userId, dto.carId);
  }

  @Post(':userId/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Alterna un favorito.' })
  toggle(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: FavoriteDto,
    @Req() request: AuthenticatedRequest,
  ): { ok: true; selected: boolean; favorites: string[] } {
    this.ensureBuyerOwnsResource(userId, request);
    return this.favoritesService.toggle(userId, dto.carId);
  }

  @Delete(':userId/:carId')
  @ApiOkResponse({ description: 'Elimina un favorito.' })
  remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('carId') carId: string,
    @Req() request: AuthenticatedRequest,
  ): { ok: true; favorites: string[] } {
    this.ensureBuyerOwnsResource(userId, request);
    return this.favoritesService.remove(userId, carId);
  }

  private ensureBuyerOwnsResource(
    userId: number,
    request: AuthenticatedRequest,
  ): void {
    if (request.user.sub !== userId) {
      throw new ForbiddenException(
        'No puedes modificar favoritos de otro usuario.',
      );
    }

    if (request.user.role !== UserRole.Buyer) {
      throw new ForbiddenException(
        'Solo los compradores pueden gestionar favoritos.',
      );
    }
  }
}
