import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComparisonService } from './comparison.service';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

@ApiTags('comparisons')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('comparisons')
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtiene la comparacion del usuario autenticado.' })
  @ApiOkResponse({ description: 'Devuelve comparacion y autos asociados.' })
  async getMyComparison(@Req() request: AuthenticatedRequest): Promise<{ id: string; carIds: string[] }> {
    return this.comparisonService.getByUserId(request.user.sub.toString());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea una nueva comparacion para el usuario autenticado.' })
  @ApiOkResponse({ description: 'Comparacion creada con exito.' })
  async create(@Req() request: AuthenticatedRequest): Promise<{ id: string; carIds: string[] }> {
    return this.comparisonService.create(request.user.sub.toString());
  }

  @Post(':id/cars/:carId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agrega un auto a una comparacion existente.' })
  @ApiOkResponse({ description: 'Auto agregado a la comparacion.' })
  async addCar(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('carId') carId: string,
  ): Promise<{ id: string; carIds: string[] }> {
    return this.comparisonService.addCar(id, request.user.sub.toString(), carId);
  }

  @Delete(':id/cars/:carId')
  @ApiOperation({ summary: 'Elimina un auto de una comparacion existente.' })
  @ApiOkResponse({ description: 'Auto eliminado de la comparacion.' })
  async removeCar(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('carId') carId: string,
  ): Promise<{ id: string; carIds: string[] }> {
    return this.comparisonService.removeCar(id, request.user.sub.toString(), carId);
  }
}
