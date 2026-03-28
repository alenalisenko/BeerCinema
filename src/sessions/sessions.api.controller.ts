import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@ApiTags('sessions')
@Controller('api/sessions')
export class SessionsApiController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Список сеансов с пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
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
  @ApiResponse({ status: 404, description: 'Сеанс не найден' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOneOrFail(id);
  }

  @Get(':id/tickets')
  @ApiOperation({ summary: 'Билеты сеанса' })
  getTickets(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findTickets(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать сеанс' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить сеанс' })
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.remove(id);
  }
}
