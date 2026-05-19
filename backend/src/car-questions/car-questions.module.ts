import { Module } from '@nestjs/common';
import { CarQuestionsController } from './car-questions.controller';
import { CarQuestionsRepository } from './car-questions.repository';
import { CarQuestionsService } from './car-questions.service';

@Module({
  controllers: [CarQuestionsController],
  providers: [CarQuestionsRepository, CarQuestionsService],
  exports: [CarQuestionsService],
})
export class CarQuestionsModule {}
