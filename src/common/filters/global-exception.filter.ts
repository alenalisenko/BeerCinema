import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { GraphQLError } from 'graphql';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const isGraphql = host.getType<string>() === 'graphql';

    if (isGraphql) {
      throw this.toGraphQLError(exception);
    }

    const response = host.switchToHttp().getResponse<Response>();
    // Ответ мог уже уйти клиенту (например, redirect из guard'а) — второй раз не пишем
    if (response.headersSent) return;
    const { status, body } = this.toHttpError(exception);
    return response.status(status).json(body);
  }

  private toGraphQLError(exception: unknown): GraphQLError {
    if (exception instanceof HttpException) {
      return new GraphQLError(exception.message, {
        extensions: { code: exception.getStatus() },
      });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { message, code } = this.parsePrismaError(exception);
      return new GraphQLError(message, { extensions: { code } });
    }

    console.error(exception);
    return new GraphQLError('Внутренняя ошибка сервера', {
      extensions: { code: 500 },
    });
  }

  private toHttpError(exception: unknown): { status: number; body: object } {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        body: exception.getResponse() as object,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { message, code } = this.parsePrismaError(exception);
      return { status: code, body: { statusCode: code, message } };
    }

    console.error(exception);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { statusCode: 500, message: 'Внутренняя ошибка сервера' },
    };
  }

  private parsePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    message: string;
    code: number;
  } {
    switch (exception.code) {
      // Запись не найдена (например, update/delete несуществующей записи)
      case 'P2025':
        return { message: 'Запись не найдена', code: HttpStatus.NOT_FOUND };

      // Нарушение уникальности (например, email уже занят)
      case 'P2002':
        return {
          message: 'Запись с такими данными уже существует',
          code: HttpStatus.CONFLICT,
        };

      // Нарушение внешнего ключа (например, sessionId или userId не существует)
      case 'P2003':
        return {
          message: 'Связанная запись не найдена (неверный ID связанной сущности)',
          code: HttpStatus.BAD_REQUEST,
        };

      // Обязательное поле отсутствует или null
      case 'P2011':
        return {
          message: 'Обязательное поле не может быть пустым',
          code: HttpStatus.BAD_REQUEST,
        };

      default:
        console.error(`Unhandled Prisma error ${exception.code}:`, exception);
        return { message: 'Ошибка базы данных', code: HttpStatus.INTERNAL_SERVER_ERROR };
    }
  }
}
