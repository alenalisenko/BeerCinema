import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Уже HTTP-исключение NestJS (NotFoundException, BadRequestException и т.д.)
    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

    // Prisma: запись не найдена
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: 404,
          message: 'Запись не найдена',
        });
      }
      // Prisma: нарушение уникальности (например, email уже занят)
      if (exception.code === 'P2002') {
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: 409,
          message: 'Запись с такими данными уже существует',
        });
      }
    }

    // Всё остальное — 500
    console.error(exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Внутренняя ошибка сервера',
    });
  }
}
