import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { EnvironmentVariables } from './config/env.validation';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  const port = configService.get('PORT', { infer: true });
  const nodeEnvironment = configService.get('NODE_ENV', { infer: true });
  const corsOrigin = configService.get('CORS_ORIGIN', { infer: true });
  const rateLimitWindowMs = configService.get('RATE_LIMIT_WINDOW_MS', {
    infer: true,
  });
  const rateLimitMax = configService.get('RATE_LIMIT_MAX', { infer: true });

  app.enableShutdownHooks();
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: rateLimitWindowMs,
      limit: rateLimitMax,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Too many requests',
      },
    }),
  );
  app.enableCors({
    origin: parseCorsOrigins(corsOrigin) ?? nodeEnvironment !== 'production',
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app);

  await app.listen(port);
}

function parseCorsOrigins(origin: string | undefined): string[] | undefined {
  if (origin === undefined) {
    return undefined;
  }

  return origin
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
