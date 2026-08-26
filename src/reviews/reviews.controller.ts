import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, Render, Redirect, Res, UseGuards, ForbiddenException, HttpException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { PageAuthGuard } from '../auth/page-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionUser } from '../auth/session-user';

@ApiExcludeController()
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly prisma: PrismaService,
  ) {}

  private isManager(user: SessionUser | null): boolean {
    return !!user && (user.role === 'MANAGER' || user.role === 'ADMIN');
  }

  // Клиент может редактировать и удалять только свои отзывы
  private async findOwnOrFail(id: number, user: SessionUser) {
    const review = await this.reviewsService.findOne(id);
    if (review && !this.isManager(user) && review.userId !== user.id) {
      throw new ForbiddenException('Это чужой отзыв');
    }
    return review;
  }

  private async loadFormData() {
    const films = await this.prisma.film.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { films, users };
  }

  // GET /reviews — список отзывов
  @Get()
  @Render('reviews/index')
  async index(@CurrentUser() user: SessionUser | null, @Query('filmId') filmId?: string, @Query('userId') userId?: string) {
    const reviews = filmId
      ? await this.reviewsService.findByFilm(parseInt(filmId))
      : userId
        ? await this.reviewsService.findByUser(parseInt(userId))
        : await this.reviewsService.findAll();
    return { title: 'Отзывы', user, reviews };
  }

  // GET /reviews/add — форма создания (фильм можно передать через ?filmId=)
  @Get('add')
  @UseGuards(PageAuthGuard)
  @Render('reviews/add')
  async addForm(@CurrentUser() user: SessionUser | null, @Query('filmId') filmId?: string) {
    const { films, users } = await this.loadFormData();
    return {
      title: 'Добавить отзыв',
      user,
      films,
      users,
      selectedFilmId: filmId ? parseInt(filmId) : null,
    };
  }

  // GET /reviews/:id/edit — форма редактирования (свой или менеджер)
  @Get(':id/edit')
  @UseGuards(PageAuthGuard)
  @Render('reviews/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const review = await this.findOwnOrFail(id, user!);
    return { title: 'Редактировать отзыв', user, review };
  }

  // GET /reviews/:id — страница отзыва
  @Get(':id')
  @Render('reviews/show')
  async show(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const review = await this.reviewsService.findOne(id);
    const canEdit = !!user && !!review && (this.isManager(user) || review.userId === user.id);
    return { title: 'Отзыв', user, review, canEdit };
  }

  // POST /reviews — клиент пишет отзыв от себя, менеджер может от любого
  @Post()
  @UseGuards(PageAuthGuard)
  async create(
    @CurrentUser() user: SessionUser | null,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const manager = this.isManager(user);
    const filmId = parseInt(body.filmId);
    try {
      await this.reviewsService.create({
        filmId,
        userId: manager && body.userId ? parseInt(body.userId) : user!.id,
        rating: parseInt(body.rating),
        comment: body.comment,
      });
      // С формы на странице фильма возвращаемся на фильм
      return res.redirect(body.from === 'film' ? `/films/${filmId}` : '/reviews');
    } catch (e) {
      const message = e instanceof HttpException ? e.message : 'Не удалось сохранить отзыв';
      const { films, users } = await this.loadFormData();
      return res.render('reviews/add', {
        title: 'Добавить отзыв',
        user,
        films,
        users,
        selectedFilmId: filmId || null,
        rating: body.rating,
        comment: body.comment,
        error: message,
      });
    }
  }

  // POST /reviews/:id/update — обновить (свой или менеджер)
  @Post(':id/update')
  @UseGuards(PageAuthGuard)
  @Redirect()
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @CurrentUser() user: SessionUser | null) {
    await this.findOwnOrFail(id, user!);
    await this.reviewsService.update(id, {
      rating: body.rating ? parseInt(body.rating) : undefined,
      comment: body.comment || undefined,
    });
    return { url: `/reviews/${id}`, statusCode: 302 };
  }

  // POST /reviews/:id/delete — удалить (свой или менеджер)
  @Post(':id/delete')
  @UseGuards(PageAuthGuard)
  @Redirect('/reviews', 302)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    await this.findOwnOrFail(id, user!);
    await this.reviewsService.remove(id);
  }
}
