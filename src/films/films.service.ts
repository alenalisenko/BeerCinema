import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FilmsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  // Сбрасываем серверный кэш списка фильмов после любой мутации,
  // иначе GET /api/films отдает устаревшие данные до истечения TTL
  private async invalidateCache() {
    await this.cache.clear();
  }

  async findAll(filters?: { q?: string; genre?: string }) {
    const films = await this.prisma.film.findMany({
      where: {
        genre: filters?.genre ? { equals: filters.genre } : undefined,
      },
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

    // Поиск по подстроке фильтруем в JS: ILIKE в Postgres с C-локалью
    // не понимает регистр кириллицы
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      return films.filter((f) => f.title.toLowerCase().includes(q));
    }
    return films;
  }

  async findGenres(): Promise<string[]> {
    const rows = await this.prisma.film.findMany({
      select: { genre: true },
      distinct: ['genre'],
      orderBy: { genre: 'asc' },
    });
    return rows.map((r) => r.genre);
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
    const film = await this.prisma.film.create({
      data: { ...data, posterUrl: data.posterUrl ?? '' },
    });
    await this.invalidateCache();
    return film;
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
    const existingFilm = await this.findOneOrFail(id);
    const nextPosterUrl = Object.prototype.hasOwnProperty.call(data, 'posterUrl')
      ? data.posterUrl
      : existingFilm.posterUrl;

    const updatedFilm = await this.prisma.film.update({
      where: { id },
      data,
    });

    if (existingFilm.posterUrl && existingFilm.posterUrl !== nextPosterUrl) {
      try {
        await this.storageService.deleteByUrl(existingFilm.posterUrl);
      } catch (error) {
        console.error('[Storage] Failed to delete old poster after film update:', error);
      }
    }

    await this.invalidateCache();
    return updatedFilm;
  }

  async remove(id: number) {
    const film = await this.findOneOrFail(id);
    const deletedFilm = await this.prisma.film.delete({
      where: { id },
    });

    if (film.posterUrl) {
      try {
        await this.storageService.deleteByUrl(film.posterUrl);
      } catch (error) {
        console.error('[Storage] Failed to delete poster after film removal:', error);
      }
    }

    await this.invalidateCache();
    return deletedFilm;
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
