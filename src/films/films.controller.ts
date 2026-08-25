import 'multer';
import { Controller, Get, Post, Param, Body, ParseIntPipe, Render, Redirect, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilmsService } from './films.service';
import { StorageService } from '../storage/storage.service';
import { Roles } from '../auth/roles.decorator';
import { PageAuthGuard } from '../auth/page-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionUser } from '../auth/session-user';

@ApiExcludeController()
@Controller('films')
export class FilmsController {
  constructor(
    private readonly filmsService: FilmsService,
    private readonly storageService: StorageService,
  ) {}

  // GET /films — список фильмов
  @Get()
  @Render('films/index')
  async index(@CurrentUser() user: SessionUser | null) {
    const films = await this.filmsService.findAll();
    return { title: 'Фильмы', user, films };
  }

  // GET /films/add — форма создания
  @Get('add')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @Render('films/add')
  addForm(@CurrentUser() user: SessionUser | null) {
    return { title: 'Добавить фильм', user };
  }

  // GET /films/:id/edit — форма редактирования
  @Get(':id/edit')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @Render('films/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const film = await this.filmsService.findOne(id);
    return { title: 'Редактировать фильм', user, film };
  }

  // GET /films/:id — страница фильма
  @Get(':id')
  @Render('films/show')
  async show(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const film = await this.filmsService.findOne(id);
    return { title: film?.title ?? 'Фильм', user, film };
  }

  // POST /films — создать + редирект на /films
  @Post()
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @UseInterceptors(FileInterceptor('poster'))
  @Redirect('/films', 302)
  async create(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const posterUrl = file
      ? await this.storageService.upload(file)
      : body.posterUrl;

    await this.filmsService.create({
      title: body.title,
      description: body.description,
      duration: parseInt(body.duration),
      genre: body.genre,
      posterUrl,
      releaseYear: parseInt(body.releaseYear),
      rating: body.rating ? parseFloat(body.rating) : undefined,
    });
  }

  // POST /films/:id/update — обновить + редирект на /films/:id
  @Post(':id/update')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @UseInterceptors(FileInterceptor('poster'))
  @Redirect()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const posterUrl = file
      ? await this.storageService.upload(file)
      : body.posterUrl || undefined;

    await this.filmsService.update(id, {
      title: body.title,
      description: body.description,
      duration: body.duration ? parseInt(body.duration) : undefined,
      genre: body.genre,
      posterUrl,
      releaseYear: body.releaseYear ? parseInt(body.releaseYear) : undefined,
      rating: body.rating ? parseFloat(body.rating) : undefined,
    });
    return { url: `/films/${id}`, statusCode: 302 };
  }

  // POST /films/:id/delete — удалить + редирект на /films
  @Post(':id/delete')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @Redirect('/films', 302)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.filmsService.remove(id);
  }
}
