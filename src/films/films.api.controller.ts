import 'multer';
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe,
  HttpCode, HttpStatus, Res, Header, UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FilmsService } from './films.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { FilmEntity, PaginatedFilmsEntity } from './entities/film.entity';
import { ETagInterceptor } from '../common/interceptors/etag.interceptor';
import { StorageService } from '../storage/storage.service';

@ApiTags('films')
@Controller('api/films')
@UseInterceptors(ETagInterceptor)
export class FilmsApiController {
  constructor(
    private readonly filmsService: FilmsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @Header('Cache-Control', 'public, max-age=3600')
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
  @UseInterceptors(CacheInterceptor)
  @Header('Cache-Control', 'public, max-age=3600')
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

  @Post(':id/poster')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'Файл постера (jpg/png/webp, до 5 МБ)' } } } })
  @ApiOperation({ summary: 'Загрузить постер фильма в облако' })
  @ApiResponse({ status: 201, description: 'Постер загружен', type: FilmEntity })
  @ApiResponse({ status: 400, description: 'Неверный файл или ID', schema: { example: { statusCode: 400, message: 'File is required' } } })
  @ApiResponse({ status: 404, description: 'Фильм не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  async uploadPoster(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
      ],
    }))
    file: Express.Multer.File,
  ) {
    const posterUrl = await this.storageService.upload(file);
    return this.filmsService.update(id, { posterUrl });
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
