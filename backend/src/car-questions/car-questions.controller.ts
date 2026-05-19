import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { PublicCarQuestion } from './car-question.entity';
import { CarQuestionsService } from './car-questions.service';
import { AnswerCarQuestionDto } from './dto/answer-car-question.dto';
import { CreateCarQuestionDto } from './dto/create-car-question.dto';

@ApiTags('car-questions')
@Controller('car-questions')
export class CarQuestionsController {
  constructor(private readonly carQuestionsService: CarQuestionsService) {}

  @Get('car/:carId')
  @ApiOkResponse({ description: 'Lista preguntas publicas de un auto.' })
  findByCarId(@Param('carId') carId: string): PublicCarQuestion[] {
    return this.carQuestionsService.findByCarId(carId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Publica una pregunta.' })
  create(@Body() dto: CreateCarQuestionDto): PublicCarQuestion {
    return this.carQuestionsService.create(dto);
  }

  @Patch(':questionId/answer')
  @ApiOkResponse({ description: 'Responde una pregunta.' })
  answer(
    @Param('questionId') questionId: string,
    @Body() dto: AnswerCarQuestionDto,
  ): PublicCarQuestion {
    return this.carQuestionsService.answer(questionId, dto);
  }
}
