import { Injectable } from '@nestjs/common';
import { AppHealthResponse } from './app-health-response';

@Injectable()
export class AppService {
  getHello(): AppHealthResponse {
    return {
      ok: true,
      message: 'Hello World!',
    };
  }
}
