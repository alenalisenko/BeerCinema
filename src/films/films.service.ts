import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilmsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.film.findMany({
      include: {
        sessions: {
          include: {
            hall: true,
          },
          orderBy: {
            startTime: 'asc',
          },
        },
        reviews: {
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
        },
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.film.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            hall: true,
          },
          orderBy: {
            startTime: 'asc',
          },
        },
        reviews: {
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
        },
      },
    });
  }

  async create(data: {
    title: string;
    description: string;
    duration: number;
    genre: string;
    posterUrl?: string;
    releaseYear: number;
    rating?: number;
  }) {
    return this.prisma.film.create({
      data: { ...data, posterUrl: data.posterUrl ?? '' },
    });
  }

  async update(id: number, data: Partial<{
    title: string;
    description: string;
    duration: number;
    genre: string;
    posterUrl: string;
    releaseYear: number;
    rating: number;
  }>) {
    return this.prisma.film.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.film.delete({
      where: { id },
    });
  }

  async findOneOrFail(id: number) {
    const film = await this.findOne(id);
    if (!film) throw new NotFoundException(`Фильм #${id} не найден`);
    return film;
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.film.findMany({
        skip,
        take: limit,
        orderBy: { title: 'asc' },
      }),
      this.prisma.film.count(),
    ]);
    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSessions(filmId: number) {
    await this.findOneOrFail(filmId);
    return this.prisma.session.findMany({
      where: { filmId },
      include: { hall: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async findReviews(filmId: number) {
    await this.findOneOrFail(filmId);
    return this.prisma.review.findMany({
      where: { filmId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
