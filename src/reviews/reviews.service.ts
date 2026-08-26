import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.review.findMany({
      include: {
        film: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        film: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findByFilm(filmId: number) {
    return this.prisma.review.findMany({
      where: { filmId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        film: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Рейтинг фильма — среднее по всем его отзывам (одна цифра после запятой)
  private async recalcFilmRating(filmId: number) {
    const agg = await this.prisma.review.aggregate({
      where: { filmId },
      _avg: { rating: true },
    });
    const avg = agg._avg.rating;
    await this.prisma.film.update({
      where: { id: filmId },
      data: { rating: avg === null ? null : Math.round(avg * 10) / 10 },
    });
  }

  async create(data: {
    filmId: number;
    userId: number;
    rating: number;
    comment: string;
  }) {
    // Один пользователь — один отзыв на фильм
    const existing = await this.prisma.review.findFirst({
      where: { filmId: data.filmId, userId: data.userId },
    });
    if (existing) {
      throw new BadRequestException('Вы уже оставляли отзыв на этот фильм');
    }

    const review = await this.prisma.review.create({
      data,
      include: {
        film: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    await this.recalcFilmRating(data.filmId);
    return review;
  }

  async update(id: number, data: Partial<{
    rating: number;
    comment: string;
  }>) {
    const review = await this.prisma.review.update({
      where: { id },
      data,
    });
    await this.recalcFilmRating(review.filmId);
    return review;
  }

  async remove(id: number) {
    const review = await this.prisma.review.delete({
      where: { id },
    });
    await this.recalcFilmRating(review.filmId);
    return review;
  }

  async findOneOrFail(id: number) {
    const review = await this.findOne(id);
    if (!review) throw new NotFoundException(`Отзыв #${id} не найден`);
    return review;
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        include: {
          film: { select: { id: true, title: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count(),
    ]);
    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
