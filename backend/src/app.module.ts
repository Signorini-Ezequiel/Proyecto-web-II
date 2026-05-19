import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CarQuestionsModule } from './car-questions/car-questions.module';
import { CarsModule } from './cars/cars.module';
import { ComparisonModule } from './comparison/comparison.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PublishedCarsModule } from './published-cars/published-cars.module';
import { UploadsModule } from './uploads/uploads.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CarsModule,
    PublishedCarsModule,
    UploadsModule,
    FavoritesModule,
    ComparisonModule,
    CarQuestionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
