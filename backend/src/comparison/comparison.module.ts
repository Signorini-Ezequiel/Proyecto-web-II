import { Module } from '@nestjs/common';
import { ComparisonController } from './comparison.controller';
import { ComparisonRepository } from './comparison.repository';
import { ComparisonService } from './comparison.service';

@Module({
  controllers: [ComparisonController],
  providers: [ComparisonRepository, ComparisonService],
  exports: [ComparisonService],
})
export class ComparisonModule {}
