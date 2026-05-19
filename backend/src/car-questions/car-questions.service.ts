import { Injectable } from '@nestjs/common';
import { PublicCarQuestion } from './car-question.entity';
import { CarQuestionsRepository } from './car-questions.repository';
import { AnswerCarQuestionDto } from './dto/answer-car-question.dto';
import { CreateCarQuestionDto } from './dto/create-car-question.dto';

@Injectable()
export class CarQuestionsService {
  constructor(
    private readonly carQuestionsRepository: CarQuestionsRepository,
  ) {}

  async findByCarId(carId: string): Promise<PublicCarQuestion[]> {
    return this.carQuestionsRepository.findByCarId(carId);
  }

  async create(dto: CreateCarQuestionDto): Promise<PublicCarQuestion> {
    return this.carQuestionsRepository.create(dto);
  }

  async answer(
    questionId: string,
    dto: AnswerCarQuestionDto,
  ): Promise<PublicCarQuestion> {
    return this.carQuestionsRepository.answer(questionId, dto);
  }
}
