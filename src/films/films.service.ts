import { Injectable } from '@nestjs/common';
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
    posterUrl: string;
    releaseYear: number;
    rating?: number;
  }) {
    return this.prisma.film.create({ data });
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
}
