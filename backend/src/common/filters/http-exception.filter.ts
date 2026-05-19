import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface NestErrorResponse {
  error?: string;
  message?: string | string[];
  statusCode?: number;
}

interface ApiErrorResponse {
  ok: false;
  statusCode: number;
  error: string;
  messages: string[];
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const normalizedResponse =
      this.normalizeExceptionResponse(exceptionResponse);
    const body: ApiErrorResponse = {
      ok: false,
      statusCode,
      error: normalizedResponse.error || HttpStatus[statusCode] || 'Error',
      messages: normalizedResponse.messages,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private normalizeExceptionResponse(response: unknown): {
    error?: string;
    messages: string[];
  } {
    if (typeof response === 'string') {
      return { messages: [response] };
    }

    if (!this.isNestErrorResponse(response)) {
      return { messages: ['Error interno del servidor.'] };
    }

    const message = response.message ?? 'Error interno del servidor.';
    const messages = Array.isArray(message) ? message : [message];

    return {
      error: response.error,
      messages,
    };
  }

  private isNestErrorResponse(
    response: unknown,
  ): response is NestErrorResponse {
    return typeof response === 'object' && response !== null;
  }
}
