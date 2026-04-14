import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity, PaginatedUsersEntity } from './entities/user.entity';

@ApiTags('users')
@Controller('api/users')
export class UsersApiController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Список пользователей с пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Список пользователей с метаданными пагинации', type: PaginatedUsersEntity })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.findAllPaginated(+page, +limit);
    const links: string[] = [];
    if (+page > 1) links.push(`</api/users?page=${+page - 1}&limit=${limit}>; rel="prev"`);
    if (+page < result.totalPages) links.push(`</api/users?page=${+page + 1}&limit=${limit}>; rel="next"`);
    if (links.length) res.setHeader('Link', links.join(', '));
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Пользователь по ID' })
  @ApiResponse({ status: 200, description: 'Пользователь найден', type: UserEntity })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Пользователь не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneOrFail(id);
  }

  @Get(':id/tickets')
  @ApiOperation({ summary: 'Билеты пользователя' })
  @ApiResponse({ status: 200, description: 'Список билетов пользователя', schema: { example: [{ id: 1, sessionId: 1, userId: 1, seat: 'A5', status: 'RESERVED', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }] } })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Пользователь не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  getTickets(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findTickets(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Отзывы пользователя' })
  @ApiResponse({ status: 200, description: 'Список отзывов пользователя', schema: { example: [{ id: 1, filmId: 1, userId: 1, rating: 5, comment: 'Отличный фильм!', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }] } })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Пользователь не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  getReviews(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findReviews(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь создан', type: UserEntity })
  @ApiResponse({ status: 400, description: 'Ошибка валидации', schema: { example: { statusCode: 400, message: ['email must be an email', 'password must be longer than or equal to 6 characters'], error: 'Bad Request' } } })
  @ApiResponse({ status: 409, description: 'Email уже занят', schema: { example: { statusCode: 409, message: 'Запись с такими данными уже существует' } } })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь обновлён', type: UserEntity })
  @ApiResponse({ status: 400, description: 'Ошибка валидации или ID не число', schema: { example: { statusCode: 400, message: ['email must be an email'], error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Пользователь не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  @ApiResponse({ status: 409, description: 'Email уже занят', schema: { example: { statusCode: 409, message: 'Запись с такими данными уже существует' } } })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({ status: 204, description: 'Пользователь удалён' })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Пользователь не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
