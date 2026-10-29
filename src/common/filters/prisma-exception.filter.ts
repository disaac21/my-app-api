import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

const ERROR_NAMES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

type PrismaError =
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientValidationError
  | Prisma.PrismaClientInitializationError;

/**
 * Turns Prisma failures into readable HTTP responses.
 *
 * This matters more than usual here: every foreign key is `onDelete: Restrict`
 * and nothing is hard-deleted, so P2003 is a normal, expected outcome — not a
 * 500 with a wall of SQL attached.
 */
@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientInitializationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.describe(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} — ${exception.message.split('\n')[0]}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      error: ERROR_NAMES[status] ?? 'Error',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private describe(exception: PrismaError): {
    status: number;
    message: string;
  } {
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        status: 503,
        message:
          'The database is unreachable. Check DATABASE_URL and that the Neon project is awake.',
      };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      // Almost always a programming error: the payload does not match the schema.
      return {
        status: 400,
        message: 'The request data could not be written to the database.',
      };
    }

    const meta = exception.meta ?? {};

    switch (exception.code) {
      case 'P2000': {
        const column =
          typeof meta.column_name === 'string' ? meta.column_name : 'a field';
        return {
          status: 400,
          message: `The value supplied for "${column}" is too long.`,
        };
      }

      case 'P2002': {
        const fields = this.targetFields(meta);
        return {
          status: 409,
          message: fields
            ? `A record with this ${fields} already exists.`
            : 'A record with these values already exists.',
        };
      }

      case 'P2003':
      case 'P2014': {
        const field =
          typeof meta.field_name === 'string' ? meta.field_name : null;
        const constraint = field ? ` (${field})` : '';
        return {
          status: 409,
          message: `This record is still referenced by other records and cannot be removed${constraint}. Archive it instead.`,
        };
      }

      case 'P2025': {
        const cause = meta.cause;
        return {
          status: 404,
          message:
            typeof cause === 'string' && cause.length > 0
              ? cause
              : 'The requested record does not exist.',
        };
      }

      default:
        return {
          status: 500,
          message: `Unexpected database error (${exception.code}).`,
        };
    }
  }

  private targetFields(meta: Record<string, unknown>): string | null {
    const target = meta.target;

    if (Array.isArray(target) && target.length > 0) {
      return target.join(', ');
    }

    if (typeof target === 'string' && target.length > 0) {
      return target;
    }

    return null;
  }
}
