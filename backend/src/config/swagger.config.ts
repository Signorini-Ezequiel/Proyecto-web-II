import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SWAGGER_PATH = 'api/docs';
const API_VERSION = '1.0.0';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Used Cars Marketplace API')
    .setDescription(
      [
        'API documentation for a used cars marketplace built with NestJS, Prisma and PostgreSQL.',
        '',
        'Example requests planned for the API:',
        '- GET /cars: list published cars',
        '- GET /cars/{id}: get a car detail',
        '- POST /cars: create a seller listing with JWT',
        '- POST /favorites: save a car as favorite with JWT',
        '- POST /auth/login: request access and refresh tokens',
      ].join('\n'),
    )
    .setVersion(API_VERSION)
    .addServer('/', 'Current environment')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste a valid JWT access token.',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication and session management')
    .addTag('Users', 'User profile and account operations')
    .addTag('Cars', 'Used car listings and search')
    .addTag('Favorites', 'Buyer favorite listings')
    .addTag('Questions', 'Buyer questions and seller answers')
    .addTag('Comparisons', 'Saved car comparisons')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'Used Cars Marketplace API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
