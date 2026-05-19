import { Module } from '@nestjs/common';
import { CarsController } from './cars.controller';
import { CarsRepository } from './cars.repository';
import { CarsService } from './cars.service';

@Module({
  controllers: [CarsController],
  providers: [CarsRepository, CarsService],
  exports: [CarsService],
})
export class CarsModule {}
