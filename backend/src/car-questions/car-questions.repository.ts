import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { QuestionMessage, UserRole as PrismaUserRole } from '@prisma/client';
import { UserRole } from '../common/types/user-role';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerCarQuestionDto } from './dto/answer-car-question.dto';
import { CreateCarQuestionDto } from './dto/create-car-question.dto';
import { CreateQuestionThreadDto } from './dto/create-question-thread.dto';
import { SendQuestionMessageDto } from './dto/send-question-message.dto';
import {
  PublicCarQuestion,
  PublicQuestionMessage,
  PublicQuestionThread,
} from './car-question.entity';

@Injectable()
export class CarQuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findThreadsByCarId(carId: string): Promise<PublicQuestionThread[]> {
    const threads = await this.prisma.questionThread.findMany({
      where: { carId },
      orderBy: { createdAt: 'asc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, role: true, avatar: true },
            },
          },
        },
      },
    });

    return threads.map((thread) => ({
      threadId: thread.id,
      carId: thread.carId,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      messages: thread.messages.map((message) => this.mapMessage(message)),
    }));
  }

  async createThread(
    dto: CreateQuestionThreadDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PublicQuestionThread> {
    const content = dto.content.trim();

    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      select: { id: true, sellerId: true },
    });

    if (!car) throw new NotFoundException('Auto no encontrado.');

    if (userRole !== UserRole.Buyer) {
      throw new ForbiddenException(
        'Solo los compradores pueden iniciar conversaciones.',
      );
    }

    const thread = await this.prisma.$transaction(async (tx) => {
      const createdThread = await tx.questionThread.create({
        data: {
          carId: car.id,
          senderId: userId,
        },
      });

      await tx.questionMessage.create({
        data: {
          threadId: createdThread.id,
          senderId: userId,
          senderRole: this.toPrismaRole(userRole),
          carId: car.id,
          content,
        },
      });

      return tx.questionThread.findUniqueOrThrow({
        where: { id: createdThread.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: { id: true, name: true, role: true, avatar: true },
              },
            },
          },
        },
      });
    });

    return {
      threadId: thread.id,
      carId: thread.carId,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      messages: thread.messages.map((message) => this.mapMessage(message)),
    };
  }

  async sendMessage(
    threadId: string,
    dto: SendQuestionMessageDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PublicQuestionMessage> {
    const content = dto.content.trim();
    const thread = await this.prisma.questionThread.findUnique({
      where: { id: threadId },
      include: {
        car: { select: { id: true, sellerId: true } },
      },
    });

    if (!thread) throw new NotFoundException('Conversacion no encontrada.');

    const isThreadAuthor = thread.senderId === userId;
    const isSellerOwner =
      userRole === UserRole.Seller && thread.car.sellerId === userId;

    if (!isThreadAuthor && !isSellerOwner) {
      throw new ForbiddenException(
        'No puedes enviar mensajes en esta conversacion.',
      );
    }

    const message = await this.prisma.questionMessage.create({
      data: {
        threadId: thread.id,
        senderId: userId,
        senderRole: this.toPrismaRole(userRole),
        carId: thread.carId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });

    await this.prisma.questionThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    return this.mapMessage(message);
  }

  async findByCarId(carId: string): Promise<PublicCarQuestion[]> {
    const threads = await this.prisma.questionThread.findMany({
      where: { carId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (threads.length > 0) {
      return threads
        .filter((thread) => thread.messages.length > 0)
        .map((thread) => {
          const first = thread.messages[0];
          const sellerAnswer = thread.messages.find(
            (message) => message.senderRole === 'SELLER',
          );

          return {
            id: thread.id,
            carId: thread.carId,
            buyerId: first.senderId,
            sellerId: sellerAnswer?.senderId ?? null,
            question: first.content,
            answer: sellerAnswer?.content,
            createdAt: first.createdAt.toISOString(),
            answeredAt: sellerAnswer?.createdAt.toISOString(),
          };
        });
    }

    return this.findLegacyQuestionsByCarId(carId);
  }

  async create(dto: CreateCarQuestionDto): Promise<PublicCarQuestion> {
    const questionText = dto.question.trim();

    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      select: { sellerId: true },
    });

    if (!car) throw new NotFoundException('Auto no encontrado.');

    const thread = await this.createThread(
      { carId: dto.carId, content: questionText },
      dto.buyerId,
      UserRole.Buyer,
    );
    const firstMessage = thread.messages[0];

    return {
      id: thread.threadId,
      carId: thread.carId,
      buyerId: firstMessage.senderId,
      sellerId: car.sellerId,
      question: firstMessage.content,
      createdAt: firstMessage.createdAt,
    };
  }

  async answer(
    questionId: string,
    dto: AnswerCarQuestionDto,
  ): Promise<PublicCarQuestion> {
    const thread = await this.prisma.questionThread.findUnique({
      where: { id: questionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        car: { select: { sellerId: true } },
      },
    });

    if (!thread) {
      return this.answerLegacyQuestion(questionId, dto);
    }

    if (thread.car.sellerId !== dto.sellerId) {
      throw new ForbiddenException(
        'Solo el vendedor de la publicacion puede responder.',
      );
    }

    const message = await this.sendMessage(
      questionId,
      { content: dto.answer },
      dto.sellerId,
      UserRole.Seller,
    );
    const firstMessage = thread.messages[0];

    if (!firstMessage) throw new NotFoundException('Pregunta no encontrada.');

    return {
      id: thread.id,
      carId: thread.carId,
      buyerId: firstMessage.senderId,
      sellerId: message.senderId,
      question: firstMessage.content,
      answer: message.content,
      createdAt: firstMessage.createdAt.toISOString(),
      answeredAt: message.createdAt,
    };
  }

  private async findLegacyQuestionsByCarId(
    carId: string,
  ): Promise<PublicCarQuestion[]> {
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

  private async answerLegacyQuestion(
    questionId: string,
    dto: AnswerCarQuestionDto,
  ): Promise<PublicCarQuestion> {
    const existing = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!existing) throw new NotFoundException('Pregunta no encontrada.');

    if (existing.sellerId !== dto.sellerId) {
      throw new ForbiddenException(
        'Solo el vendedor de la publicacion puede responder.',
      );
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
      answeredAt: updated.updatedAt
        ? updated.updatedAt.toISOString()
        : undefined,
    };
  }

  private mapMessage(
    message: QuestionMessage & {
      sender: {
        id: string;
        name: string;
        role: PrismaUserRole;
        avatar: string | null;
      };
    },
  ): PublicQuestionMessage {
    return {
      messageId: message.id,
      threadId: message.threadId,
      senderId: message.senderId,
      senderRole: this.mapRole(message.senderRole),
      carId: message.carId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        role: this.mapRole(message.sender.role),
        avatarUrl: message.sender.avatar,
      },
    };
  }

  private mapRole(role: PrismaUserRole): UserRole {
    return role === 'SELLER' ? UserRole.Seller : UserRole.Buyer;
  }

  private toPrismaRole(role: UserRole): PrismaUserRole {
    return role === UserRole.Seller ? 'SELLER' : 'BUYER';
  }
}
