import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, Render, Redirect } from '@nestjs/common';
import { UsersService } from './users.service';

type Role = 'CLIENT' | 'ADMIN' | 'MANAGER';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private getUser(auth?: string) {
    return auth === 'true' ? { name: 'Алёна Лисенко' } : null;
  }

  // GET /users — список пользователей
  @Get()
  @Render('users/index')
  async index(@Query('auth') auth?: string, @Query('email') email?: string) {
    const users = email
      ? await this.usersService.findByEmail(email)
      : await this.usersService.findAll();
    return { title: 'Пользователи', user: this.getUser(auth), users };
  }

  // GET /users/add — форма создания (ВАЖНО: до /:id)
  @Get('add')
  @Render('users/add')
  addForm(@Query('auth') auth?: string) {
    const roles: Role[] = ['CLIENT', 'ADMIN', 'MANAGER'];
    return { title: 'Добавить пользователя', user: this.getUser(auth), roles };
  }

  // GET /users/:id/edit — форма редактирования
  @Get(':id/edit')
  @Render('users/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const userData = await this.usersService.findOne(id);
    const roles: Role[] = ['CLIENT', 'ADMIN', 'MANAGER'];
    return { title: 'Редактировать пользователя', user: this.getUser(auth), userData, roles };
  }

  // GET /users/:id — страница пользователя
  @Get(':id')
  @Render('users/show')
  async show(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const userData = await this.usersService.findOne(id);
    return { title: userData?.name ?? 'Пользователь', user: this.getUser(auth), userData };
  }

  // POST /users — создать → редирект на /users
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

  // POST /users/:id/update — обновить → редирект на /users/:id
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

  // POST /users/:id/delete — удалить → редирект на /users
  @Post(':id/delete')
  @Redirect('/users', 302)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
  }
}
