import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerCarQuestionDto } from './dto/answer-car-question.dto';
import { CreateCarQuestionDto } from './dto/create-car-question.dto';
import { PublicCarQuestion } from './car-question.entity';

@Injectable()
export class CarQuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCarId(carId: string): Promise<PublicCarQuestion[]> {
    const items = await this.prisma.question.findMany({
      where: { carId },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((it) => ({
      id: it.id,
      carId: it.carId,
      buyerId: it.buyerId,
      sellerId: it.sellerId,
      question: it.question,
      answer: it.answer ?? undefined,
      createdAt: it.createdAt.toISOString(),
      answeredAt: it.updatedAt ? it.updatedAt.toISOString() : undefined,
    }));
  }

  async create(dto: CreateCarQuestionDto): Promise<PublicCarQuestion> {
    const created = await this.prisma.question.create({
      data: {
        carId: dto.carId,
        buyerId: dto.buyerId,
        sellerId: dto.sellerId,
        question: dto.question.trim(),
      },
    });

    return {
      id: created.id,
      carId: created.carId,
      buyerId: created.buyerId,
      sellerId: created.sellerId,
      question: created.question,
      answer: created.answer ?? undefined,
      createdAt: created.createdAt.toISOString(),
      answeredAt: created.updatedAt ? created.updatedAt.toISOString() : undefined,
    };
  }

  async answer(questionId: string, dto: AnswerCarQuestionDto): Promise<PublicCarQuestion> {
    const existing = await this.prisma.question.findUnique({ where: { id: questionId } });

    if (!existing) throw new NotFoundException('Pregunta no encontrada.');

    if (existing.sellerId !== dto.sellerId) {
      throw new ForbiddenException('Solo el vendedor de la publicacion puede responder.');
    }

    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: { answer: dto.answer.trim() },
    });

    return {
      id: updated.id,
      carId: updated.carId,
      buyerId: updated.buyerId,
      sellerId: updated.sellerId,
      question: updated.question,
      answer: updated.answer ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      answeredAt: updated.updatedAt ? updated.updatedAt.toISOString() : undefined,
    };
  }
}
