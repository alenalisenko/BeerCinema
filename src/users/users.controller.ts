import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, Render, Redirect, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.decorator';
import { PageAuthGuard } from '../auth/page-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionUser } from '../auth/session-user';

type Role = 'CLIENT' | 'ADMIN' | 'MANAGER';

@ApiExcludeController()
@UseGuards(PageAuthGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users — список пользователей
  @Get()
  @Render('users/index')
  async index(@CurrentUser() user: SessionUser | null, @Query('email') email?: string) {
    const users = email
      ? await this.usersService.findByEmail(email)
      : await this.usersService.findAll();
    return { title: 'Пользователи', user, users };
  }

  // GET /users/add — форма создания
  @Get('add')
  @Render('users/add')
  addForm(@CurrentUser() user: SessionUser | null) {
    const roles: Role[] = ['CLIENT', 'ADMIN', 'MANAGER'];
    return { title: 'Добавить пользователя', user, roles };
  }

  // GET /users/:id/edit — форма редактирования
  @Get(':id/edit')
  @Render('users/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const userData = await this.usersService.findOne(id);
    const roles: Role[] = ['CLIENT', 'ADMIN', 'MANAGER'];
    return { title: 'Редактировать пользователя', user, userData, roles };
  }

  // GET /users/:id — страница пользователя
  @Get(':id')
  @Render('users/show')
  async show(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const userData = await this.usersService.findOne(id);
    return { title: userData?.name ?? 'Пользователь', user, userData };
  }

  // POST /users — создать + редирект на /users
  @Post()
  @Redirect('/users', 302)
  async create(@Body() body: any) {
    await this.usersService.create({
      email: body.email,
      name: body.name,
      password: body.password,
      role: body.role as Role || 'CLIENT',
    });
  }

  // POST /users/:id/update — обновить + редирект на /users/:id
  @Post(':id/update')
  @Redirect()
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    await this.usersService.update(id, {
      email: body.email || undefined,
      name: body.name || undefined,
      password: body.password || undefined,
      role: body.role as Role || undefined,
    });
    return { url: `/users/${id}`, statusCode: 302 };
  }

  // POST /users/:id/delete — удалить + редирект на /users
  @Post(':id/delete')
  @Redirect('/users', 302)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
  }
}
