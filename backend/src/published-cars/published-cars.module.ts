import { Module } from '@nestjs/common';
import { PublishedCarsController } from './published-cars.controller';
import { PublishedCarsRepository } from './published-cars.repository';
import { PublishedCarsService } from './published-cars.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [PublishedCarsController],
  providers: [PublishedCarsRepository, PublishedCarsService],
  exports: [PublishedCarsService],
})
export class PublishedCarsModule {}
