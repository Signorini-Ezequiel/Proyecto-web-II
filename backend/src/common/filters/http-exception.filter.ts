import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    console.error(exception);
    console.error((exception as Error).stack);

    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode = this.getStatusCode(exception);
    const normalizedResponse = this.normalizeException(exception, statusCode);
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

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return HttpStatus.BAD_REQUEST;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') return HttpStatus.NOT_FOUND;
      if (['P2002', 'P2003', 'P2023'].includes(exception.code)) {
        return HttpStatus.BAD_REQUEST;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private normalizeException(
    exception: unknown,
    statusCode: number,
  ): {
    error?: string;
    messages: string[];
  } {
    if (exception instanceof HttpException) {
      return this.normalizeExceptionResponse(exception.getResponse());
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        error: 'Bad Request',
        messages: [
          'El payload no coincide con el schema de Prisma. Revisa tipos, campos requeridos y nombres de columnas.',
        ],
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.normalizePrismaKnownError(exception);
    }

    return {
      error: HttpStatus[statusCode] || 'Internal Server Error',
      messages: [
        (exception as Error)?.message ||
          'Error inesperado al procesar la solicitud.',
      ],
    };
  }

  private normalizePrismaKnownError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): {
    error: string;
    messages: string[];
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          error: 'Bad Request',
          messages: ['Ya existe un registro con datos unicos repetidos.'],
        };
      case 'P2003':
        return {
          error: 'Bad Request',
          messages: [
            'La relacion indicada no existe o no es valida para guardar este registro.',
          ],
        };
      case 'P2025':
        return {
          error: 'Not Found',
          messages: ['El recurso solicitado no existe.'],
        };
      case 'P2023':
        return {
          error: 'Bad Request',
          messages: [
            'Hay un dato persistido con formato incompatible con el schema Prisma actual. Revisa IDs legacy y tipos de relaciones.',
          ],
        };
      default:
        return {
          error: 'Bad Request',
          messages: [
            `Prisma rechazo la operacion (${exception.code}): ${exception.message}`,
          ],
        };
    }
  }

  private normalizeExceptionResponse(response: unknown): {
    error?: string;
    messages: string[];
  } {
    if (typeof response === 'string') {
      return { messages: [response] };
    }

    if (!this.isNestErrorResponse(response)) {
      return { messages: ['Error inesperado al procesar la solicitud.'] };
    }

    const message =
      response.message ?? 'Error inesperado al procesar la solicitud.';
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
