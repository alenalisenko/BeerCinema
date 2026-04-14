import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewEntity, PaginatedReviewsEntity } from './entities/review.entity';

@ApiTags('reviews')
@Controller('api/reviews')
export class ReviewsApiController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Список отзывов с пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Список отзывов с метаданными пагинации', type: PaginatedReviewsEntity })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.reviewsService.findAllPaginated(+page, +limit);
    const links: string[] = [];
    if (+page > 1) links.push(`</api/reviews?page=${+page - 1}&limit=${limit}>; rel="prev"`);
    if (+page < result.totalPages) links.push(`</api/reviews?page=${+page + 1}&limit=${limit}>; rel="next"`);
    if (links.length) res.setHeader('Link', links.join(', '));
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отзыв по ID' })
  @ApiResponse({ status: 200, description: 'Отзыв найден', type: ReviewEntity })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Отзыв не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOneOrFail(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать отзыв' })
  @ApiResponse({ status: 201, description: 'Отзыв создан', type: ReviewEntity })
  @ApiResponse({ status: 400, description: 'Ошибка валидации', schema: { example: { statusCode: 400, message: ['rating must not be greater than 5', 'comment should not be empty'], error: 'Bad Request' } } })
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить отзыв' })
  @ApiResponse({ status: 200, description: 'Отзыв обновлён', type: ReviewEntity })
  @ApiResponse({ status: 400, description: 'Ошибка валидации или ID не число', schema: { example: { statusCode: 400, message: ['rating must not be greater than 5'], error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Отзыв не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить отзыв' })
  @ApiResponse({ status: 204, description: 'Отзыв удалён' })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Отзыв не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.remove(id);
  }
}
