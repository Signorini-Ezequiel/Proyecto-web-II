import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AppHealthResponse } from './app-health-response';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
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
}
