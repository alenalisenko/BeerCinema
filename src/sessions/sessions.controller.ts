import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, Render, Redirect, Sse, MessageEvent } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { FilmsService } from '../films/films.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiExcludeController()
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly filmsService: FilmsService,
  ) {}

  private getUser(auth?: string) {
    return auth === 'true' ? { name: 'Алёна Лисенко' } : null;
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  // GET /sessions — список сеансов
  @Get()
  @Render('sessions/index')
  async index(@Query('auth') auth?: string, @Query('filmId') filmId?: string, @Query('date') date?: string) {
    const sessions = filmId
      ? await this.sessionsService.findByFilm(parseInt(filmId))
      : date
        ? await this.sessionsService.findByDate(new Date(date))
        : await this.sessionsService.findAll();

    const formatted = sessions.map((s) => ({
      ...s,
      startTimeFormatted: this.formatDateTime(s.startTime),
      endTimeFormatted: this.formatDateTime(s.endTime),
    }));
    return { title: 'Сеансы', user: this.getUser(auth), sessions: formatted };
  }

  // GET /sessions/add — форма создания
  @Get('add')
  @Render('sessions/add')
  async addForm(@Query('auth') auth?: string) {
    const films = await this.filmsService.findAll();
    const halls = await this.sessionsService.findAllHalls();
    return { title: 'Добавить сеанс', user: this.getUser(auth), films, halls };
  }

  // GET /sessions/:id/edit — форма редактирования
  @Get(':id/edit')
  @Render('sessions/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const session = await this.sessionsService.findOne(id);
    const films = await this.filmsService.findAll();
    const halls = await this.sessionsService.findAllHalls();
    return { title: 'Редактировать сеанс', user: this.getUser(auth), session, films, halls };
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
  async show(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const session = await this.sessionsService.findOne(id);
    const formatted = session ? {
      ...session,
      startTimeFormatted: this.formatDateTime(session.startTime),
      endTimeFormatted: this.formatDateTime(session.endTime),
    } : null;
    return { title: 'Сеанс', user: this.getUser(auth), session: formatted };
  }

  // POST /sessions — создать → редирект на /sessions
  @Post()
  @Redirect('/sessions', 302)
  async create(@Body() body: any) {
    await this.sessionsService.create({
      filmId: parseInt(body.filmId),
      hallId: parseInt(body.hallId),
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      price: parseFloat(body.price),
    });
  }

  // POST /sessions/:id/update — обновить → редирект на /sessions/:id
  @Post(':id/update')
  @Redirect()
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    await this.sessionsService.update(id, {
      filmId: body.filmId ? parseInt(body.filmId) : undefined,
      hallId: body.hallId ? parseInt(body.hallId) : undefined,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      price: body.price ? parseFloat(body.price) : undefined,
    });
    return { url: `/sessions/${id}`, statusCode: 302 };
  }

  // POST /sessions/:id/delete — удалить → редирект на /sessions
  @Post(':id/delete')
  @Redirect('/sessions', 302)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.sessionsService.remove(id);
  }
}
