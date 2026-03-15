import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.session.findMany({
      include: {
        film: true,
        hall: true,
        tickets: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.session.findUnique({
      where: { id },
      include: {
        film: true,
        hall: true,
        tickets: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findByFilm(filmId: number) {
    return this.prisma.session.findMany({
      where: { filmId },
      include: {
        hall: true,
        tickets: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async findByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.session.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        film: true,
        hall: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async create(data: {
    filmId: number;
    hallId: number;
    startTime: Date;
    endTime: Date;
    price: number;
  }) {
    return this.prisma.session.create({
      data,
      include: {
        film: true,
        hall: true,
      },
    });
  }

  async update(id: number, data: Partial<{
    filmId: number;
    hallId: number;
    startTime: Date;
    endTime: Date;
    price: number;
  }>) {
    return this.prisma.session.update({
      where: { id },
      data,
      include: {
        film: true,
        hall: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.session.delete({
      where: { id },
    });
  }
}
