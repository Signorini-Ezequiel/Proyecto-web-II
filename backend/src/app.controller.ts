import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AppHealthResponse } from './app-health-response';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica el estado de salud de la API.' })
  @ApiOkResponse({
    description: 'Mensaje de estado de la API.',
    schema: {
      example: {
        ok: true,
        message: 'Hello World!',
      },
    },
  })
  getHello(): AppHealthResponse {
    return this.appService.getHello();
  }

  @Get('test-image-url')
  @ApiOperation({ summary: 'Devuelve una URL absoluta de imagen subida.' })
  @ApiOkResponse({
    description: 'URL absoluta de una imagen disponible para probar vision.',
  })
  async getTestImageUrl(): Promise<{
    imageUrl: string | null;
    exists: boolean;
  }> {
    return this.appService.getTestImageUrl();
  }
}
