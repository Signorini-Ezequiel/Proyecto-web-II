import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { json, urlencoded } from 'express';
import { join } from 'node:path';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const logger = new Logger('Bootstrap');

  // =========================
  // BODY LIMITS
  // =========================

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // =========================
  // CORS
  // =========================

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // =========================
  // PREFIX
  // =========================

  app.setGlobalPrefix('api');

  // =========================
  // STATIC FILES (UPLOADS)
  // =========================

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // =========================
  // FILTERS
  // =========================

  app.useGlobalFilters(new HttpExceptionFilter());

  // =========================
  // VALIDATION
  // =========================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // =========================
  // SWAGGER
  // =========================

  setupSwagger(app);

  // =========================

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port);

  logger.log(`Backend running on http://localhost:${port}`);
  logger.log(`Swagger available at http://localhost:${port}/api/docs`);
  logger.log(`Uploads available at http://localhost:${port}/uploads`);
}

void bootstrap();