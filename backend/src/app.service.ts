import { Injectable } from '@nestjs/common';
import { readdir } from 'node:fs/promises';
import { AppHealthResponse } from './app-health-response';

@Injectable()
export class AppService {
  getHello(): AppHealthResponse {
    return {
      ok: true,
      message: 'Hello World!',
    };
  }

  async getTestImageUrl(): Promise<{
    imageUrl: string | null;
    exists: boolean;
  }> {
    const publicBaseUrl = this.getBackendPublicUrl();

    try {
      const files = await readdir('uploads');
      const image = files.find((file) => /\.(jpe?g|png|webp)$/i.test(file));

      return {
        imageUrl: image
          ? new URL(`/uploads/${image}`, publicBaseUrl).toString()
          : null,
        exists: Boolean(image),
      };
    } catch {
      return {
        imageUrl: null,
        exists: false,
      };
    }
  }

  private getBackendPublicUrl(): string {
    const baseUrl =
      process.env.BACKEND_PUBLIC_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    return baseUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '') + '/';
  }
}
