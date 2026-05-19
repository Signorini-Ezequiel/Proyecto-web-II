import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ExceptionBody = {
  error?: unknown;
  message?: unknown;
  statusCode?: unknown;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    console.error(exception);
    console.error((exception as Error).stack);
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode = this.getStatusCode(exception);

    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getMessage(exception, statusCode),
    });
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(
    exception: unknown,
    statusCode: number,
  ): string | string[] {
    if (!(exception instanceof HttpException)) {
      return (
        (exception as Error)?.message ||
        'Error inesperado al procesar la solicitud.'
      );
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (isExceptionBody(exceptionResponse)) {
      const message = exceptionResponse.message;

      if (typeof message === 'string' || isStringArray(message)) {
        return message;
      }
    }

    return HttpStatus[statusCode] ?? 'Unexpected error';
  }
}

function isExceptionBody(value: unknown): value is ExceptionBody {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}
