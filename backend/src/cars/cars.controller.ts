import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import type { Car } from './entities/car.entity';

@ApiTags('cars')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista autos filtrados por parámetros.' })
  @ApiOkResponse({ description: 'Lista autos filtrables.' })
  findAll(@Query() filters: FilterCarsDto): Car[] {
    return this.carsService.findAll(filters);
  }

  @Get('makes')
  @ApiOperation({ summary: 'Obtiene marcas de autos disponibles.' })
  @ApiOkResponse({ description: 'Lista marcas disponibles.' })
  getMakes(): Array<string | number> {
    return this.carsService.getMakes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un auto por su identificador.' })
  @ApiOkResponse({ description: 'Obtiene un auto por id.' })
  findById(@Param('id') id: string): Car {
    return this.carsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo registro de auto.' })
  @ApiCreatedResponse({ description: 'Crea un auto base.' })
  create(@Body() dto: CreateCarDto): Car {
    return this.carsService.create(dto);
  }
}
