import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { UserRole } from '../common/types/user-role';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import type { Car } from './entities/car.entity';

@ApiTags('cars')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista autos filtrados por parametros.' })
  @ApiOkResponse({ description: 'Lista autos filtrables.' })
  async findAll(@Query() filters: FilterCarsDto): Promise<Car[]> {
    try {
      return await this.carsService.findAll(filters);
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  @Get('makes')
  @ApiOperation({ summary: 'Obtiene marcas de autos disponibles.' })
  @ApiOkResponse({ description: 'Lista marcas disponibles.' })
  async getMakes(): Promise<Array<string | number>> {
    try {
      return await this.carsService.getMakes();
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un auto por su identificador.' })
  @ApiOkResponse({ description: 'Obtiene un auto por id.' })
  async findById(@Param('id') id: string): Promise<Car> {
    try {
      return await this.carsService.findById(id);
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crea un nuevo registro de auto.' })
  @ApiCreatedResponse({ description: 'Crea un auto base.' })
  async create(@Body() dto: CreateCarDto, @Req() request: AuthenticatedRequest): Promise<Car> {
    try {
      if (request.user.role !== UserRole.Seller) {
        throw new ForbiddenException('Solo los vendedores pueden crear autos.');
      }

      return await this.carsService.create(dto, request.user.sub);
    } catch (error) {
      this.logAndRethrow(error);
    }
  }

  private logAndRethrow(error: unknown): never {
    console.error(error);
    console.error((error as Error).stack);
    throw error;
  }
}
