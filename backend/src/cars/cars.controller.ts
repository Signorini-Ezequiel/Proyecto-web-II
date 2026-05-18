import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CarsService } from './cars.service';
import { CarResponseDto, CarsListResponseDto } from './dto/car-response.dto';
import { CreateCarDto } from './dto/create-car.dto';
import { FindCarsQueryDto } from './dto/find-cars-query.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@ApiTags('Cars')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  @ApiOperation({ summary: 'List published cars with optional filters' })
  @ApiOkResponse({ type: CarsListResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid filters or pagination' })
  findAll(@Query() query: FindCarsQueryDto): Promise<CarsListResponseDto> {
    return this.carsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a published car by id' })
  @ApiOkResponse({ type: CarResponseDto })
  @ApiNotFoundResponse({ description: 'Car not found' })
  findOne(@Param('id') id: string): Promise<CarResponseDto> {
    return this.carsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a car listing as a seller' })
  @ApiCreatedResponse({ type: CarResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Only sellers can create cars' })
  create(
    @Body() createCarDto: CreateCarDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CarResponseDto> {
    return this.carsService.create(createCarDto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a car listing as owner seller or admin' })
  @ApiOkResponse({ type: CarResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Only owner seller or admin can update' })
  @ApiNotFoundResponse({ description: 'Car not found' })
  update(
    @Param('id') id: string,
    @Body() updateCarDto: UpdateCarDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CarResponseDto> {
    return this.carsService.update(id, updateCarDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete a car listing as owner seller or admin' })
  @ApiOkResponse({ type: CarResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Only owner seller or admin can delete' })
  @ApiNotFoundResponse({ description: 'Car not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<CarResponseDto> {
    return this.carsService.remove(id, user);
  }
}
