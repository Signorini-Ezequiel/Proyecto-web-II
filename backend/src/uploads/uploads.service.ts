import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class UploadsService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  validateImage(file: UploadFile): void {
    if (!file) {
      throw new BadRequestException('No se recibieron archivos de imagen.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPG, PNG y WebP.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Cada imagen debe pesar como máximo 5 MB.');
    }
  }

  async uploadImages(files: UploadFile[]): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes subir al menos una imagen.');
    }

    if (files.length > 10) {
      throw new BadRequestException('Solo se permiten hasta 10 imágenes.');
    }

    const urls: string[] = [];

    for (const file of files) {
      this.validateImage(file);
      urls.push(await this.uploadFileBuffer(file));
    }

    return urls;
  }

  private uploadFileBuffer(file: UploadFile): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'autopoint_uploads',
          format: file.mimetype === 'image/webp' ? 'webp' : undefined,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            reject(new InternalServerErrorException('Error al subir la imagen.'));
            return;
          }

          resolve(result.secure_url);
        },
      );

      if (!file.buffer) {
        reject(new BadRequestException('No se pudo procesar el archivo.'));
        return;
      }

      uploadStream.end(file.buffer);
    });
  }
}
