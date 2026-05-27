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
import type {
  PublicCarQuestion,
  PublicQuestionMessage,
  PublicQuestionThread,
} from './car-question.entity';
import { CarQuestionsService } from './car-questions.service';
import { AnswerCarQuestionDto } from './dto/answer-car-question.dto';
import { CreateCarQuestionDto } from './dto/create-car-question.dto';
import { CreateQuestionThreadDto } from './dto/create-question-thread.dto';
import { SendQuestionMessageDto } from './dto/send-question-message.dto';

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

  @Get('threads/car/:carId')
  @ApiOkResponse({ description: 'Lista conversaciones publicas de un auto.' })
  async findThreadsByCarId(
    @Param('carId') carId: string,
  ): Promise<PublicQuestionThread[]> {
    return this.carQuestionsService.findThreadsByCarId(carId);
  }

  @Post('threads')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ description: 'Crea una conversacion publica.' })
  async createThread(
    @Body() dto: CreateQuestionThreadDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicQuestionThread> {
    return this.carQuestionsService.createThread(
      dto,
      request.user.sub,
      request.user.role,
    );
  }

  @Post('threads/:threadId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({ description: 'Agrega un mensaje a una conversacion.' })
  async sendMessage(
    @Param('threadId') threadId: string,
    @Body() dto: SendQuestionMessageDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicQuestionMessage> {
    return this.carQuestionsService.sendMessage(
      threadId,
      dto,
      request.user.sub,
      request.user.role,
    );
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
      buyerId: request.user.sub,
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
      sellerId: request.user.sub,
    });
  }

  @Post(':questionId/answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ description: 'Responde una pregunta.' })
  async answerWithPost(
    @Param('questionId') questionId: string,
    @Body() dto: AnswerCarQuestionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicCarQuestion> {
    return this.answer(questionId, dto, request);
  }
}
