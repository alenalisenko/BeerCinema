import { Injectable } from '@nestjs/common';
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

  async create(data: {
    filmId: number;
    userId: number;
    rating: number;
    comment: string;
  }) {
    return this.prisma.review.create({
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
  }

  async update(id: number, data: Partial<{
    rating: number;
    comment: string;
  }>) {
    return this.prisma.review.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.review.delete({
      where: { id },
    });
  }
}
