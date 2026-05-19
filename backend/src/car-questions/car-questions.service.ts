import { Injectable } from '@nestjs/common';
import { PublicCarQuestion } from './car-question.entity';
import { CarQuestionsRepository } from './car-questions.repository';
import { AnswerCarQuestionDto } from './dto/answer-car-question.dto';
import { CreateCarQuestionDto } from './dto/create-car-question.dto';

@Injectable()
export class CarQuestionsService {
  constructor(private readonly carQuestionsRepository: CarQuestionsRepository) {}

  findByCarId(carId: string): PublicCarQuestion[] {
    return this.carQuestionsRepository.findByCarId(carId);
  }

  create(dto: CreateCarQuestionDto): PublicCarQuestion {
    return this.carQuestionsRepository.create(dto);
  }

  answer(questionId: string, dto: AnswerCarQuestionDto): PublicCarQuestion {
    return this.carQuestionsRepository.answer(questionId, dto);
  }
}
