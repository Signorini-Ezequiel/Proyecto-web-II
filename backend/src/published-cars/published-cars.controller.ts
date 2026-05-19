import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  findAll(): PublishedCar[] {
    return this.publishedCarsService.findAll();
  }

  @Get('seller/:sellerId')
  @ApiOkResponse({ description: 'Lista publicaciones por vendedor.' })
  findBySellerId(
    @Param('sellerId', ParseIntPipe) sellerId: number,
  ): PublishedCar[] {
    return this.publishedCarsService.findBySellerId(sellerId);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Obtiene una publicacion por id.' })
  findById(@Param('id') id: string): PublishedCar {
    return this.publishedCarsService.findById(id);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Crea una publicacion.' })
  create(@Body() dto: CreatePublishedCarDto): PublishedCar {
    return this.publishedCarsService.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Actualiza una publicacion.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePublishedCarDto,
  ): PublishedCar {
    return this.publishedCarsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Elimina una publicacion.' })
  delete(@Param('id') id: string): { ok: true } {
    return this.publishedCarsService.delete(id);
  }
}
