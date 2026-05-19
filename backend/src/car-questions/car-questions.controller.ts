import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  async findByCarId(@Param('carId') carId: string): Promise<PublicCarQuestion[]> {
    return this.carQuestionsService.findByCarId(carId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Publica una pregunta.' })
  async create(@Body() dto: CreateCarQuestionDto): Promise<PublicCarQuestion> {
    return this.carQuestionsService.create(dto);
  }

  @Patch(':questionId/answer')
  @ApiOkResponse({ description: 'Responde una pregunta.' })
  async answer(
    @Param('questionId') questionId: string,
    @Body() dto: AnswerCarQuestionDto,
  ): Promise<PublicCarQuestion> {
    return this.carQuestionsService.answer(questionId, dto);
  }
}
