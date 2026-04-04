import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@ApiTags('tickets')
@Controller('api/tickets')
export class TicketsApiController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Список билетов с пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Список билетов с метаданными пагинации' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.ticketsService.findAllPaginated(+page, +limit);
    const links: string[] = [];
    if (+page > 1) links.push(`</api/tickets?page=${+page - 1}&limit=${limit}>; rel="prev"`);
    if (+page < result.totalPages) links.push(`</api/tickets?page=${+page + 1}&limit=${limit}>; rel="next"`);
    if (links.length) res.setHeader('Link', links.join(', '));
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Билет по ID' })
  @ApiResponse({ status: 200, description: 'Билет найден' })
  @ApiResponse({ status: 404, description: 'Билет не найден' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOneOrFail(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать билет (забронировать место)' })
  @ApiResponse({ status: 201, description: 'Билет создан', type: CreateTicketDto })
  @ApiResponse({ status: 400, description: 'Место уже занято или ошибка валидации' })
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить статус билета' })
  @ApiResponse({ status: 200, description: 'Статус билета обновлён' })
  @ApiResponse({ status: 404, description: 'Билет не найден' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketDto) {
    if (!dto.status) return this.ticketsService.findOneOrFail(id);
    return this.ticketsService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить билет' })
  @ApiResponse({ status: 204, description: 'Билет удалён' })
  @ApiResponse({ status: 404, description: 'Билет не найден' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }
}
