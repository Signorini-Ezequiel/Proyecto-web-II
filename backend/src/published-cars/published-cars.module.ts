import { Module } from '@nestjs/common';
import { PublishedCarsController } from './published-cars.controller';
import { PublishedCarsRepository } from './published-cars.repository';
import { PublishedCarsService } from './published-cars.service';

@Module({
  controllers: [PublishedCarsController],
  providers: [PublishedCarsRepository, PublishedCarsService],
  exports: [PublishedCarsService],
})
export class PublishedCarsModule {}
