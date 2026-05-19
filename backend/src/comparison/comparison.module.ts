import { Module } from '@nestjs/common';

import { ComparisonController } from './comparison.controller';
import { ComparisonRepository } from './comparison.repository';
import { ComparisonService } from './comparison.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ComparisonController],
  providers: [ComparisonRepository, ComparisonService],
  exports: [ComparisonService],
})
export class ComparisonModule {}
