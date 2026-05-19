import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ComparisonCarDto } from './dto/comparison-car.dto';
import { ComparisonService } from './comparison.service';

@ApiTags('comparison')
@Controller('comparison')
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  @Get(':userId')
  @ApiOkResponse({ description: 'Lista ids en comparacion.' })
  getIds(@Param('userId', ParseIntPipe) userId: number): string[] {
    return this.comparisonService.getIds(userId);
  }

  @Post(':userId')
  @ApiOkResponse({ description: 'Agrega un auto a comparacion.' })
  add(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ComparisonCarDto,
  ): { ok: true; ids: string[] } {
    return this.comparisonService.add(userId, dto.carId);
  }

  @Post(':userId/toggle')
  @ApiOkResponse({ description: 'Alterna un auto en comparacion.' })
  toggle(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ComparisonCarDto,
  ): { ok: true; selected: boolean; ids: string[] } {
    return this.comparisonService.toggle(userId, dto.carId);
  }

  @Delete(':userId')
  @ApiOkResponse({ description: 'Limpia la comparacion.' })
  clear(@Param('userId', ParseIntPipe) userId: number): { ok: true; ids: string[] } {
    return this.comparisonService.clear(userId);
  }

  @Delete(':userId/:carId')
  @ApiOkResponse({ description: 'Quita un auto de comparacion.' })
  remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('carId') carId: string,
  ): { ok: true; ids: string[] } {
    return this.comparisonService.remove(userId, carId);
  }
}
