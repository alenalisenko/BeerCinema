import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, Render, Redirect } from '@nestjs/common';
import { FilmsService } from './films.service';

@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  private getUser(auth?: string) {
    return auth === 'true' ? { name: 'Алёна Лисенко' } : null;
  }

  // GET /films — список фильмов
  @Get()
  @Render('films/index')
  async index(@Query('auth') auth?: string) {
    const films = await this.filmsService.findAll();
    return { title: 'Фильмы', user: this.getUser(auth), films };
  }

  // GET /films/add — форма создания
  @Get('add')
  @Render('films/add')
  addForm(@Query('auth') auth?: string) {
    return { title: 'Добавить фильм', user: this.getUser(auth) };
  }

  // GET /films/:id/edit — форма редактирования
  @Get(':id/edit')
  @Render('films/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const film = await this.filmsService.findOne(id);
    return { title: 'Редактировать фильм', user: this.getUser(auth), film };
  }

  // GET /films/:id — страница фильма
  @Get(':id')
  @Render('films/show')
  async show(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const film = await this.filmsService.findOne(id);
    return { title: film?.title ?? 'Фильм', user: this.getUser(auth), film };
  }

  // POST /films — создать + редирект на /films
  @Post()
  @Redirect('/films', 302)
  async create(@Body() body: any) {
    await this.filmsService.create({
      title: body.title,
      description: body.description,
      duration: parseInt(body.duration),
      genre: body.genre,
      posterUrl: body.posterUrl,
      releaseYear: parseInt(body.releaseYear),
      rating: body.rating ? parseFloat(body.rating) : undefined,
    });
  }

  // POST /films/:id/update — обновить + редирект на /films/:id
  @Post(':id/update')
  @Redirect()
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    await this.filmsService.update(id, {
      title: body.title,
      description: body.description,
      duration: body.duration ? parseInt(body.duration) : undefined,
      genre: body.genre,
      posterUrl: body.posterUrl,
      releaseYear: body.releaseYear ? parseInt(body.releaseYear) : undefined,
      rating: body.rating ? parseFloat(body.rating) : undefined,
    });
    return { url: `/films/${id}`, statusCode: 302 };
  }

  // POST /films/:id/delete — удалить + редирект на /films
  @Post(':id/delete')
  @Redirect('/films', 302)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.filmsService.remove(id);
  }
}
