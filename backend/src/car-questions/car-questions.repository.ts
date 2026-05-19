import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnswerCarQuestionDto } from './dto/answer-car-question.dto';
import { CreateCarQuestionDto } from './dto/create-car-question.dto';
import { PublicCarQuestion } from './car-question.entity';

@Injectable()
export class CarQuestionsRepository {
  private readonly questions = new Map<string, PublicCarQuestion>();

  findByCarId(carId: string): PublicCarQuestion[] {
    return [...this.questions.values()]
      .filter((question) => question.carId === carId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  create(dto: CreateCarQuestionDto): PublicCarQuestion {
    const question: PublicCarQuestion = {
      id: `question_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      carId: dto.carId,
      buyerId: dto.buyerId,
      sellerId: dto.sellerId,
      question: dto.question.trim(),
      createdAt: new Date().toISOString(),
    };

    this.questions.set(question.id, question);
    return question;
  }

  answer(questionId: string, dto: AnswerCarQuestionDto): PublicCarQuestion {
    const question = this.questions.get(questionId);

    if (!question) {
      throw new NotFoundException('Pregunta no encontrada.');
    }

    if (question.sellerId !== dto.sellerId) {
      throw new ForbiddenException('Solo el vendedor de la publicacion puede responder.');
    }

    const answeredQuestion: PublicCarQuestion = {
      ...question,
      answer: dto.answer.trim(),
      answeredAt: new Date().toISOString(),
    };

    this.questions.set(questionId, answeredQuestion);
    return answeredQuestion;
  }
}
