import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SWAGGER_PATH = 'api/docs';
const API_VERSION = '1.0';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Proyecto Web II API')
    .setDescription('API completa del sistema')
    .setVersion(API_VERSION)
    .addServer('/', 'Current environment')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Ingrese un token JWT válido en el encabezado Authorization.',
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
    customSiteTitle: 'Proyecto Web II API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
