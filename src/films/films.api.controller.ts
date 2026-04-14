import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { FilmsService } from './films.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { FilmEntity, PaginatedFilmsEntity } from './entities/film.entity';

@ApiTags('films')
@Controller('api/films')
export class FilmsApiController {
  constructor(private readonly filmsService: FilmsService) {}

  @Get()
  @ApiOperation({ summary: 'Список фильмов с пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Список фильмов с метаданными пагинации', type: PaginatedFilmsEntity })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.filmsService.findAllPaginated(+page, +limit);
    const links: string[] = [];
    if (+page > 1) links.push(`</api/films?page=${+page - 1}&limit=${limit}>; rel="prev"`);
    if (+page < result.totalPages) links.push(`</api/films?page=${+page + 1}&limit=${limit}>; rel="next"`);
    if (links.length) res.setHeader('Link', links.join(', '));
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Фильм по ID' })
  @ApiResponse({ status: 200, description: 'Фильм найден', type: FilmEntity })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Фильм не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.findOneOrFail(id);
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Сеансы фильма' })
  @ApiResponse({ status: 200, description: 'Список сеансов фильма', schema: { example: [{ id: 1, filmId: 1, hallId: 1, startTime: '2026-04-15T10:00:00.000Z', endTime: '2026-04-15T12:00:00.000Z', price: 350, createdAt: '2026-01-01T00:00:00.000Z' }] } })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Фильм не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  getSessions(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.findSessions(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Отзывы о фильме' })
  @ApiResponse({ status: 200, description: 'Список отзывов о фильме', schema: { example: [{ id: 1, filmId: 1, userId: 1, rating: 5, comment: 'Отличный фильм!', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }] } })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Фильм не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  getReviews(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.findReviews(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать фильм' })
  @ApiResponse({ status: 201, description: 'Фильм создан', type: FilmEntity })
  @ApiResponse({ status: 400, description: 'Ошибка валидации', schema: { example: { statusCode: 400, message: ['title should not be empty', 'duration must be an integer number'], error: 'Bad Request' } } })
  create(@Body() dto: CreateFilmDto) {
    return this.filmsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить фильм' })
  @ApiResponse({ status: 200, description: 'Фильм обновлён', type: FilmEntity })
  @ApiResponse({ status: 400, description: 'Ошибка валидации или ID не число', schema: { example: { statusCode: 400, message: ['rating must not be greater than 5'], error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Фильм не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFilmDto) {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить фильм' })
  @ApiResponse({ status: 204, description: 'Фильм удалён' })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Фильм не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.remove(id);
  }
}
