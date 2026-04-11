import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('api/users')
export class UsersApiController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Список пользователей с пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Список пользователей с метаданными пагинации' })
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
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 400, description: 'ID должен быть числом' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneOrFail(id);
  }

  @Get(':id/tickets')
  @ApiOperation({ summary: 'Билеты пользователя' })
  @ApiResponse({ status: 200, description: 'Список билетов пользователя' })
  @ApiResponse({ status: 400, description: 'ID должен быть числом' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  getTickets(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findTickets(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Отзывы пользователя' })
  @ApiResponse({ status: 200, description: 'Список отзывов пользователя' })
  @ApiResponse({ status: 400, description: 'ID должен быть числом' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  getReviews(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findReviews(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь создан', type: CreateUserDto })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 409, description: 'Email уже занят' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь обновлён' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации или ID не число' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Email уже занят' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({ status: 204, description: 'Пользователь удалён' })
  @ApiResponse({ status: 400, description: 'ID должен быть числом' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
