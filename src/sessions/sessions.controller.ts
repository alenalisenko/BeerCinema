import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, Render, Redirect, Res, Sse, MessageEvent, UseGuards, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { FilmsService } from '../films/films.service';
import { Roles } from '../auth/roles.decorator';
import { PageAuthGuard } from '../auth/page-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionUser } from '../auth/session-user';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiExcludeController()
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly filmsService: FilmsService,
  ) {}

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  // GET /sessions — список сеансов
  @Get()
  @Render('sessions/index')
  async index(
    @CurrentUser() user: SessionUser | null,
    @Query('filmId') filmId?: string,
    @Query('date') date?: string,
    @Query('all') all?: string,
  ) {
    const showAll = all === '1';
    const sessions = filmId
      ? await this.sessionsService.findByFilm(parseInt(filmId))
      : date
        ? await this.sessionsService.findByDate(new Date(date))
        : await this.sessionsService.findAll(!showAll);

    const formatted = sessions.map((s) => ({
      ...s,
      startTimeFormatted: this.formatDateTime(s.startTime),
      endTimeFormatted: this.formatDateTime(s.endTime),
    }));
    return { title: 'Сеансы', user, sessions: formatted, showAll };
  }

  // GET /sessions/add — форма создания
  @Get('add')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @Render('sessions/add')
  async addForm(@CurrentUser() user: SessionUser | null) {
    const films = await this.filmsService.findAll();
    const halls = await this.sessionsService.findAllHalls();
    return { title: 'Добавить сеанс', user, films, halls };
  }

  // GET /sessions/:id/edit — форма редактирования
  @Get(':id/edit')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @Render('sessions/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const session = await this.sessionsService.findOne(id);
    const films = await this.filmsService.findAll();
    const halls = await this.sessionsService.findAllHalls();
    return { title: 'Редактировать сеанс', user, session, films, halls };
  }

  // GET /sessions/events — SSE-стрим событий
  @Sse('events')
  sse(): Observable<MessageEvent> {
    return this.sessionsService.events$.pipe(
      map((event) => ({ data: event })),
    );
  }

  // GET /sessions/:id — страница сеанса
  @Get(':id')
  @Render('sessions/show')
  async show(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const session = await this.sessionsService.findOne(id);
    const formatted = session ? {
      ...session,
      startTimeFormatted: this.formatDateTime(session.startTime),
      endTimeFormatted: this.formatDateTime(session.endTime),
    } : null;
    return { title: 'Сеанс', user, session: formatted };
  }

  // POST /sessions — создать → редирект на /sessions
  @Post()
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  async create(@Body() body: any, @CurrentUser() user: SessionUser | null, @Res() res: Response) {
    try {
      await this.sessionsService.create({
        filmId: parseInt(body.filmId),
        hallId: parseInt(body.hallId),
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        price: parseFloat(body.price),
      });
      return res.redirect('/sessions');
    } catch (e) {
      // Ошибка расписания (пересечение, конец раньше начала): возвращаем форму
      const message = e instanceof HttpException ? e.message : 'Не удалось сохранить сеанс';
      const films = await this.filmsService.findAll();
      const halls = await this.sessionsService.findAllHalls();
      return res.render('sessions/add', {
        title: 'Добавить сеанс',
        user, films, halls,
        form: body,
        error: message,
      });
    }
  }

  // POST /sessions/:id/update — обновить → редирект на /sessions/:id
  @Post(':id/update')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @CurrentUser() user: SessionUser | null, @Res() res: Response) {
    try {
      await this.sessionsService.update(id, {
        filmId: body.filmId ? parseInt(body.filmId) : undefined,
        hallId: body.hallId ? parseInt(body.hallId) : undefined,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        price: body.price ? parseFloat(body.price) : undefined,
      });
      return res.redirect(`/sessions/${id}`);
    } catch (e) {
      const message = e instanceof HttpException ? e.message : 'Не удалось сохранить сеанс';
      const session = await this.sessionsService.findOne(id);
      const films = await this.filmsService.findAll();
      const halls = await this.sessionsService.findAllHalls();
      return res.render('sessions/edit', {
        title: 'Редактировать сеанс',
        user, session, films, halls,
        error: message,
      });
    }
  }

  // POST /sessions/:id/delete — удалить → редирект на /sessions
  @Post(':id/delete')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @Redirect('/sessions', 302)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.sessionsService.remove(id);
  }
}
