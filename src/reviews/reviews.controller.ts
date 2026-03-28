import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, Render, Redirect } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly prisma: PrismaService,
  ) {}

  private getUser(auth?: string) {
    return auth === 'true' ? { name: 'Алёна Лисенко' } : null;
  }

  // GET /reviews — список отзывов
  @Get()
  @Render('reviews/index')
  async index(@Query('auth') auth?: string, @Query('filmId') filmId?: string, @Query('userId') userId?: string) {
    const reviews = filmId
      ? await this.reviewsService.findByFilm(parseInt(filmId))
      : userId
        ? await this.reviewsService.findByUser(parseInt(userId))
        : await this.reviewsService.findAll();
    return { title: 'Отзывы', user: this.getUser(auth), reviews };
  }

  // GET /reviews/add — форма создания
  @Get('add')
  @Render('reviews/add')
  async addForm(@Query('auth') auth?: string) {
    const films = await this.prisma.film.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { title: 'Добавить отзыв', user: this.getUser(auth), films, users };
  }

  // GET /reviews/:id/edit — форма редактирования
  @Get(':id/edit')
  @Render('reviews/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const review = await this.reviewsService.findOne(id);
    return { title: 'Редактировать отзыв', user: this.getUser(auth), review };
  }

  // GET /reviews/:id — страница отзыва
  @Get(':id')
  @Render('reviews/show')
  async show(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const review = await this.reviewsService.findOne(id);
    return { title: 'Отзыв', user: this.getUser(auth), review };
  }

  // POST /reviews — создать → редирект на /reviews
  @Post()
  @Redirect('/reviews', 302)
  async create(@Body() body: any) {
    await this.reviewsService.create({
      filmId: parseInt(body.filmId),
      userId: parseInt(body.userId),
      rating: parseInt(body.rating),
      comment: body.comment,
    });
  }

  // POST /reviews/:id/update — обновить → редирект на /reviews/:id
  @Post(':id/update')
  @Redirect()
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    await this.reviewsService.update(id, {
      rating: body.rating ? parseInt(body.rating) : undefined,
      comment: body.comment || undefined,
    });
    return { url: `/reviews/${id}`, statusCode: 302 };
  }

  // POST /reviews/:id/delete — удалить → редирект на /reviews
  @Post(':id/delete')
  @Redirect('/reviews', 302)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.reviewsService.remove(id);
  }
}
