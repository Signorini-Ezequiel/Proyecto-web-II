import {
  BadRequestException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { UserRole } from '../common/types/user-role';
import { UploadsService } from './uploads.service';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOADS_DIR = join(process.cwd(), 'uploads');

type UploadImagesResponse =
  | {
      ok: true;
      images: string[];
    }
  | {
      ok: false;
      message: string;
    };

function ensureUploadsDir(): void {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function imageFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(
      new BadRequestException('Solo se permiten imagenes JPG, PNG y WebP.'),
      false,
    );
    return;
  }

  callback(null, true);
}

function buildUploadFilename(file: Express.Multer.File): string {
  const safeBase = file.originalname
    .replace(extname(file.originalname), '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const extension = extname(file.originalname).toLowerCase();
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  return `${safeBase || 'image'}-${suffix}${extension}`;
}

@ApiTags('uploads')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['images'],
    },
  })
  @ApiOkResponse({
    description: 'Sube imagenes y devuelve las URLs locales.',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            images: {
              type: 'array',
              items: { type: 'string' },
              example: ['/uploads/auto-123.jpg'],
            },
          },
        },
        {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: false },
            message: {
              type: 'string',
              example: 'Debes subir al menos una imagen.',
            },
          },
        },
      ],
    },
  })
  @UseInterceptors(
    FilesInterceptor('images', MAX_FILES, {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureUploadsDir();
          callback(null, UPLOADS_DIR);
        },
        filename: (_req, file, callback) => {
          callback(null, buildUploadFilename(file));
        },
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES,
      },
    }),
  )
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Req() request: AuthenticatedRequest,
  ): UploadImagesResponse {
    try {
      if (request.user.role !== UserRole.Seller) {
        throw new ForbiddenException(
          'Solo los vendedores pueden subir imagenes.',
        );
      }

      if (!files || files.length === 0) {
        return {
          ok: false,
          message: 'Debes subir al menos una imagen.',
        };
      }

      const images = this.uploadsService.uploadImages(files);
      return { ok: true, images };
    } catch (error) {
      console.error(error);
      console.error((error as Error).stack);
      throw error;
    }
  }
}
