# Guia del backend

Esta guia explica como esta organizado el backend de AutoPoint y que flujo seguir para agregar endpoints, modelos o integraciones.

## Stack

- NestJS 11.
- TypeScript.
- Prisma 6.
- PostgreSQL.
- JWT con access token y refresh token.
- Multer para carga de imagenes.
- Swagger para documentacion HTTP.
- Groq SDK para analisis IA de datos e imagenes.

## Comandos

```bash
cd backend
npm install
npm run start:dev
npm run build
npm run test
```

Comandos Prisma frecuentes:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma db seed
```

## Variables de entorno

Archivo local:

```text
backend/.env
```

Variables principales:

| Variable | Requerida | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Si | Conexion PostgreSQL para Prisma. |
| `JWT_SECRET` | Si | Firma de tokens JWT. |
| `PORT` | Si | Puerto del backend. |
| `NODE_ENV` | No | `development`, `test` o `production`. |
| `JWT_ACCESS_EXPIRES_IN` | No | Duracion del access token. Default `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | No | Duracion del refresh token. Default `7d`. |
| `CORS_ORIGIN` | No | Origen permitido del frontend. |
| `BACKEND_PUBLIC_URL` | No | URL publica del backend para construir URLs absolutas de uploads. |
| `GROQ_API_KEY` | No | API key de Groq. Si falta, la IA devuelve fallback. |
| `GROQ_MODEL` | No | Modelo de texto. |
| `GROQ_VISION_MODEL` | No | Modelo multimodal para imagenes. |
| `RATE_LIMIT_WINDOW_MS` | No | Ventana para limites. |
| `RATE_LIMIT_MAX` | No | Maximo de requests por ventana. |

La validacion vive en `backend/src/config/env.validation.ts`.

## Bootstrap

El archivo `backend/src/main.ts` configura:

- Limite de body JSON/urlencoded.
- CORS.
- Prefijo global `/api`.
- Archivos estaticos desde `/uploads`.
- Filtro global de excepciones HTTP.
- `ValidationPipe`.
- Swagger en `/api/docs`.

URLs locales:

```text
API: http://localhost:3000/api
Swagger: http://localhost:3000/api/docs
Uploads: http://localhost:3000/uploads
Test imagen: http://localhost:3000/api/test-image-url
```

## Arquitectura por modulos

El backend sigue el patron NestJS por feature:

```text
src/
├── auth/
├── users/
├── cars/
├── published-cars/
├── favorites/
├── comparison/
├── car-questions/
├── uploads/
├── ai/
└── prisma/
```

Patron general:

- `controller`: define rutas HTTP, guards, parametros y DTOs.
- `service`: aplica reglas de negocio.
- `repository`: encapsula queries Prisma cuando la feature lo requiere.
- `dto`: valida input HTTP.
- `entity` o `types`: shape de respuestas y tipos internos.
- `module`: registra providers/controllers.

## Prisma

Archivos importantes:

- `backend/prisma/schema.prisma`: modelos y relaciones.
- `backend/prisma/migrations/`: historial de migraciones.
- `backend/prisma/seed.ts`: datos iniciales.
- `backend/src/prisma/prisma.service.ts`: cliente Prisma inyectable.
- `backend/prisma.config.ts`: configuracion Prisma.

Flujo para cambiar el modelo:

1. Editar `prisma/schema.prisma`.
2. Crear migracion local:

```bash
npx prisma migrate dev --name nombre_del_cambio
```

3. Regenerar cliente si hace falta:

```bash
npx prisma generate
```

4. Ajustar repositorios, DTOs y tipos.
5. Correr build.

En produccion/Railway no usar `migrate dev`; usar:

```bash
npx prisma migrate deploy
```

## Modelos principales

- `User`: usuarios compradores/vendedores, credenciales y refresh token.
- `Car`: publicaciones de autos.
- `Favorite`: favoritos por usuario.
- `Comparison` y `ComparisonCar`: listas de comparacion.
- `QuestionThread` y `QuestionMessage`: conversaciones sobre publicaciones.
- `AIAnalysis`: cache de analisis IA de datos.
- `ImageAnalysis`: cache de analisis visual por hash de imagenes.

## Autenticacion y roles

Archivos principales:

- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/strategies/jwt.strategy.ts`
- `src/auth/guards/jwt-auth.guard.ts`
- `src/auth/guards/roles.guard.ts`
- `src/auth/decorators/current-user.decorator.ts`
- `src/auth/decorators/roles.decorator.ts`

Flujo:

1. Login/registro devuelve tokens.
2. El frontend envia `Authorization: Bearer <token>`.
3. `JwtAuthGuard` valida el token.
4. `RolesGuard` limita acciones por rol cuando corresponde.
5. `CurrentUser` permite leer el usuario autenticado en controllers.

## Uploads

La feature esta en `src/uploads/`.

Reglas actuales:

- Tipos permitidos: JPG, PNG y WebP.
- Maximo por archivo: 5 MB.
- Maximo por request: 10 imagenes.
- El backend devuelve rutas `/uploads/...`.
- `main.ts` sirve la carpeta `uploads` como archivos estaticos.

Importante para deploy:

- En Railway, el filesystem puede ser efimero segun la configuracion del servicio.
- Para produccion real conviene mover imagenes a Cloudinary, S3 u otro storage persistente.
- Mientras se use filesystem local, validar que las imagenes subidas sigan existiendo despues de redeploys.

## IA con Groq

La feature esta en `src/ai/`.

Endpoints principales:

- `POST /api/ai/analyze-car/:carId`: analisis de datos.
- `POST /api/ai/analyze-images/:carId`: analisis visual.
- `POST /api/ai/compare-cars`: comparacion de autos.
- `GET /api/ai/cars/:carId/analysis`: analisis combinado.
- `POST /api/ai/cars/:carId/analysis/regenerate`: fuerza regeneracion.

Analisis de datos:

- Usa `GROQ_MODEL`.
- Analiza solo metadata del auto.
- Cachea en `AIAnalysis` con `dataHash`.

Analisis visual:

- Usa `GROQ_VISION_MODEL`.
- Envia hasta 3 imagenes.
- Construye contenido multimodal con `text` e `image_url`.
- Convierte rutas `/uploads/...` a URLs absolutas.
- Si la URL no es publica o no se puede validar, intenta enviar base64 inline.
- Cachea en `ImageAnalysis` con `imageHash`.
- Si Groq falla, devuelve una estructura valida con mensaje temporal sin inventar danos.

Para que Groq pueda analizar URLs, `BACKEND_PUBLIC_URL` debe apuntar a una URL accesible por internet. En local, si se usa `localhost`, el backend puede caer al fallback base64 para imagenes locales.

## Errores

El filtro global esta en `src/common/filters/http-exception.filter.ts`.

Convenciones:

- Usar excepciones Nest (`BadRequestException`, `NotFoundException`, `ForbiddenException`, etc.).
- No devolver errores crudos de Prisma o proveedores externos al frontend.
- Para servicios externos, loggear el detalle en backend y devolver un mensaje amigable.

## Swagger

Swagger se configura en `src/config/swagger.config.ts` y se publica en:

```text
http://localhost:3000/api/docs
```

Al agregar endpoints:

- Usar `@ApiTags`.
- Agregar `@ApiOkResponse` y descripciones utiles.
- Documentar auth con `@ApiBearerAuth` si corresponde.

## Checklist para agregar un endpoint

1. Crear DTO para body/query si hay input.
2. Agregar metodo en controller.
3. Aplicar `JwtAuthGuard` y `Roles` si corresponde.
4. Implementar regla en service.
5. Agregar query en repository si la feature usa repository.
6. Tipar la respuesta.
7. Agregar documentacion Swagger minima.
8. Probar con Swagger o curl.
9. Correr `npm run build`.

## Checklist para agregar una tabla Prisma

1. Editar `schema.prisma`.
2. Crear migracion con `migrate dev`.
3. Regenerar Prisma Client.
4. Agregar relaciones e indices necesarios.
5. Crear repository/service/controller si expone API.
6. Actualizar seed si hace falta.
7. Correr build.

## Railway

Configuracion recomendada del servicio backend:

- Root directory: `backend`.
- Build command:

```bash
npm install && npx prisma generate && npm run build
```

- Start command:

```bash
npx prisma migrate deploy && npm run start:prod
```

Variables recomendadas:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=...
CORS_ORIGIN=https://tu-frontend.netlify.app
BACKEND_PUBLIC_URL=https://tu-backend.up.railway.app
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=llama-3.2-90b-vision-preview
```

Problemas comunes:

- Si falla Prisma en deploy, revisar `DATABASE_URL` y que `prisma generate` corra en build.
- Si el frontend no puede llamar la API, revisar `CORS_ORIGIN` y `VITE_API_URL`.
- Si Groq no ve imagenes, revisar `BACKEND_PUBLIC_URL` y probar `/api/test-image-url`.
- Si se pierden uploads tras redeploy, mover imagenes a storage persistente.
