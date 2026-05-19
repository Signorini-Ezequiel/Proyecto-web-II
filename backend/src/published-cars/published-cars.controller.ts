import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { UserRole } from '../common/types/user-role';
import { CreatePublishedCarDto } from './dto/create-published-car.dto';
import { UpdatePublishedCarDto } from './dto/update-published-car.dto';
import type { PublishedCar } from './published-car.entity';
import { PublishedCarsService } from './published-cars.service';

@ApiTags('published-cars')
@Controller('published-cars')
export class PublishedCarsController {
  constructor(private readonly publishedCarsService: PublishedCarsService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista autos publicados.' })
  async findAll(): Promise<PublishedCar[]> {
    try {
      return await this.publishedCarsService.findAll();
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  @Get('seller/:sellerId')
  @ApiOkResponse({ description: 'Lista publicaciones por vendedor.' })
  async findBySellerId(
    @Param('sellerId', ParseIntPipe) sellerId: number,
  ): Promise<PublishedCar[]> {
    try {
      return await this.publishedCarsService.findBySellerId(sellerId);
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Obtiene una publicacion por id.' })
  async findById(@Param('id') id: string): Promise<PublishedCar> {
    try {
      return await this.publishedCarsService.findById(id);
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ description: 'Crea una publicacion.' })
  async create(
    @Body() dto: CreatePublishedCarDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublishedCar> {
    try {
      this.ensureSeller(request);
      return await this.publishedCarsService.create({
        ...dto,
        sellerId: request.user.sub,
      });
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'Actualiza una publicacion.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePublishedCarDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublishedCar> {
    try {
      this.ensureSeller(request);
      await this.ensureOwnPublication(id, request);
      return await this.publishedCarsService.update(id, {
        ...dto,
        sellerId: request.user.sub,
      });
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'Elimina una publicacion.' })
  async delete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ ok: true }> {
    try {
      this.ensureSeller(request);
      await this.ensureOwnPublication(id, request);
      return await this.publishedCarsService.delete(id);
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  private ensureSeller(request: AuthenticatedRequest): void {
    if (request.user.role !== UserRole.Seller) {
      throw new ForbiddenException(
        'Solo los vendedores pueden gestionar publicaciones.',
      );
    }
  }

  private async ensureOwnPublication(
    id: string,
    request: AuthenticatedRequest,
  ): Promise<void> {
    const car = await this.publishedCarsService.findById(id);

    if (car.sellerId !== request.user.sub) {
      throw new ForbiddenException('No puedes modificar esta publicacion.');
    }
  }

  private logAndRethrow(error: unknown): never {
    console.error(error);
    console.error((error as Error).stack);
    throw error;
  }
}
