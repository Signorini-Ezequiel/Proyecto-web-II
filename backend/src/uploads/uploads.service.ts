import { BadRequestException, Injectable } from '@nestjs/common';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 10;

@Injectable()
export class UploadsService {
  validateImage(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se recibieron archivos de imagen.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Solo se permiten imagenes JPG, PNG y WebP.',
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Cada imagen debe pesar como maximo 5 MB.');
    }
  }

  uploadImages(files: Express.Multer.File[]): string[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes subir al menos una imagen.');
    }

    if (files.length > MAX_FILES) {
      throw new BadRequestException(
        `Solo se permiten hasta ${MAX_FILES} imagenes.`,
      );
    }

    files.forEach((file) => this.validateImage(file));

    return files.map((file) => `/uploads/${file.filename}`);
  }
}
