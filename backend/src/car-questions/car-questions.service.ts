import { Injectable } from '@nestjs/common';
import { PublicCarQuestion } from './car-question.entity';
import type {
  PublicQuestionMessage,
  PublicQuestionThread,
} from './car-question.entity';
import { CarQuestionsRepository } from './car-questions.repository';
import { AnswerCarQuestionDto } from './dto/answer-car-question.dto';
import { CreateCarQuestionDto } from './dto/create-car-question.dto';
import { CreateQuestionThreadDto } from './dto/create-question-thread.dto';
import { SendQuestionMessageDto } from './dto/send-question-message.dto';
import { UserRole } from '../common/types/user-role';

@Injectable()
export class CarQuestionsService {
  constructor(
    private readonly carQuestionsRepository: CarQuestionsRepository,
  ) {}

  async findByCarId(carId: string): Promise<PublicCarQuestion[]> {
    return this.carQuestionsRepository.findByCarId(carId);
  }

  async findThreadsByCarId(carId: string): Promise<PublicQuestionThread[]> {
    return this.carQuestionsRepository.findThreadsByCarId(carId);
  }

  async createThread(
    dto: CreateQuestionThreadDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PublicQuestionThread> {
    return this.carQuestionsRepository.createThread(dto, userId, userRole);
  }

  async sendMessage(
    threadId: string,
    dto: SendQuestionMessageDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PublicQuestionMessage> {
    return this.carQuestionsRepository.sendMessage(
      threadId,
      dto,
      userId,
      userRole,
    );
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
