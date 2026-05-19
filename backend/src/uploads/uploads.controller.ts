import { BadRequestException, Controller, HttpCode, HttpStatus, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function imageFileFilter(
  _req: Express.Request,
  file: UploadFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(new BadRequestException('Solo se permiten imágenes JPG, PNG y WebP.'), false);
    return;
  }

  callback(null, true);
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('images', MAX_FILES, {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    }),
  )
  async uploadImages(@UploadedFiles() files: UploadFile[]): Promise<{ images: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes subir al menos una imagen.');
    }

    const images = await this.uploadsService.uploadImages(files);
    return { images };
  }
}
