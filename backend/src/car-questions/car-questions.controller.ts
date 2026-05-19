import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
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
import type { PublicCarQuestion } from './car-question.entity';
import { CarQuestionsService } from './car-questions.service';
import { AnswerCarQuestionDto } from './dto/answer-car-question.dto';
import { CreateCarQuestionDto } from './dto/create-car-question.dto';

@ApiTags('questions')
@Controller('questions')
export class CarQuestionsController {
  constructor(private readonly carQuestionsService: CarQuestionsService) {}

  @Get('car/:carId')
  @ApiOkResponse({ description: 'Lista preguntas publicas de un auto.' })
  async findByCarId(
    @Param('carId') carId: string,
  ): Promise<PublicCarQuestion[]> {
    return this.carQuestionsService.findByCarId(carId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ description: 'Publica una pregunta.' })
  async create(
    @Body() dto: CreateCarQuestionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicCarQuestion> {
    if (request.user.role !== UserRole.Buyer) {
      throw new ForbiddenException(
        'Solo los compradores pueden publicar preguntas.',
      );
    }

    return this.carQuestionsService.create({
      ...dto,
      buyerId: request.user.sub.toString(),
    });
  }

  @Patch(':questionId/answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'Responde una pregunta.' })
  async answer(
    @Param('questionId') questionId: string,
    @Body() dto: AnswerCarQuestionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicCarQuestion> {
    if (request.user.role !== UserRole.Seller) {
      throw new ForbiddenException(
        'Solo los vendedores pueden responder preguntas.',
      );
    }

    return this.carQuestionsService.answer(questionId, {
      ...dto,
      sellerId: request.user.sub.toString(),
    });
  }
}
