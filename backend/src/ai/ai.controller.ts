import {
  Controller,
  Get,
  Body,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { AiService } from './ai.service';
import type {
  VehicleAIAnalysisResponse,
  VehicleComparisonAnalysisResponse,
  VehicleDataAnalysisResponse,
  VehicleImageAnalysisResponse,
} from './ai-analysis.entity';

type CompareCarsBody = {
  carIds?: string[];
};

@ApiTags('ai')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-car/:carId')
  @ApiOkResponse({ description: 'Obtiene o genera analisis IA de datos.' })
  async analyzeCarData(
    @Param('carId') carId: string,
    @Query('force') force: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<VehicleDataAnalysisResponse> {
    return this.aiService.analyzeCarDataById(
      carId,
      request.user.sub,
      force === 'true',
    );
  }

  @Post('analyze-images/:carId')
  @ApiOkResponse({ description: 'Obtiene o genera analisis IA visual.' })
  async analyzeImages(
    @Param('carId') carId: string,
    @Query('force') force: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<VehicleImageAnalysisResponse> {
    return this.aiService.analyzeCarImagesById(
      carId,
      request.user.sub,
      force === 'true',
    );
  }

  @Post('compare-cars')
  @ApiOkResponse({ description: 'Obtiene o genera comparacion IA real.' })
  async compareCars(
    @Body() body: CompareCarsBody,
    @Query('force') force: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<VehicleComparisonAnalysisResponse> {
    return this.aiService.analyzeComparison(
      body.carIds ?? [],
      request.user.sub,
      force === 'true',
    );
  }

  @Get('cars/:carId/analysis')
  @ApiOkResponse({ description: 'Obtiene o genera analisis IA del vehiculo.' })
  async analyzeCar(
    @Param('carId') carId: string,
    @Query('force') force: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<VehicleAIAnalysisResponse> {
    return this.aiService.analyzeCar(carId, request.user.sub, force === 'true');
  }

  @Post('cars/:carId/analysis/regenerate')
  @ApiOkResponse({ description: 'Regenera analisis IA del vehiculo.' })
  async regenerateCarAnalysis(
    @Param('carId') carId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<VehicleAIAnalysisResponse> {
    return this.aiService.analyzeCar(carId, request.user.sub, true);
  }
}
