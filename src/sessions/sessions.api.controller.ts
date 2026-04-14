import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionEntity, PaginatedSessionsEntity } from './entities/session.entity';

@ApiTags('sessions')
@Controller('api/sessions')
export class SessionsApiController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Список сеансов с пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Список сеансов с метаданными пагинации', type: PaginatedSessionsEntity })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.sessionsService.findAllPaginated(+page, +limit);
    const links: string[] = [];
    if (+page > 1) links.push(`</api/sessions?page=${+page - 1}&limit=${limit}>; rel="prev"`);
    if (+page < result.totalPages) links.push(`</api/sessions?page=${+page + 1}&limit=${limit}>; rel="next"`);
    if (links.length) res.setHeader('Link', links.join(', '));
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Сеанс по ID' })
  @ApiResponse({ status: 200, description: 'Сеанс найден', type: SessionEntity })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Сеанс не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOneOrFail(id);
  }

  @Get(':id/tickets')
  @ApiOperation({ summary: 'Билеты сеанса' })
  @ApiResponse({ status: 200, description: 'Список билетов сеанса', schema: { example: [{ id: 1, sessionId: 1, userId: 1, seat: 'A5', status: 'RESERVED', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }] } })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Сеанс не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  getTickets(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findTickets(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать сеанс' })
  @ApiResponse({ status: 201, description: 'Сеанс создан', type: SessionEntity })
  @ApiResponse({ status: 400, description: 'Ошибка валидации', schema: { example: { statusCode: 400, message: ['filmId must be an integer number', 'startTime must be a valid ISO 8601 date string'], error: 'Bad Request' } } })
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить сеанс' })
  @ApiResponse({ status: 200, description: 'Сеанс обновлён', type: SessionEntity })
  @ApiResponse({ status: 400, description: 'Ошибка валидации или ID не число', schema: { example: { statusCode: 400, message: ['price must not be less than 0'], error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Сеанс не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить сеанс' })
  @ApiResponse({ status: 204, description: 'Сеанс удалён' })
  @ApiResponse({ status: 400, description: 'ID должен быть числом', schema: { example: { statusCode: 400, message: 'Validation failed (numeric string is expected)', error: 'Bad Request' } } })
  @ApiResponse({ status: 404, description: 'Сеанс не найден', schema: { example: { statusCode: 404, message: 'Запись не найдена' } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.remove(id);
  }
}
