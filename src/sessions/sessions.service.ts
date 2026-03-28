import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject } from 'rxjs';

export interface SessionEvent {
  action: 'created' | 'updated' | 'deleted';
  sessionId: number;
  message: string;
}

@Injectable()
export class SessionsService {
  private readonly eventBus = new Subject<SessionEvent>();
  readonly events$ = this.eventBus.asObservable();

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
    const result = await this.prisma.session.create({
      data,
      include: { film: true, hall: true },
    });
    this.eventBus.next({
      action: 'created',
      sessionId: result.id,
      message: `Добавлен новый сеанс: «${result.film.title}» в зале ${result.hall.name}`,
    });
    return result;
  }

  async update(id: number, data: Partial<{
    filmId: number;
    hallId: number;
    startTime: Date;
    endTime: Date;
    price: number;
  }>) {
    const result = await this.prisma.session.update({
      where: { id },
      data,
      include: { film: true, hall: true },
    });
    this.eventBus.next({
      action: 'updated',
      sessionId: result.id,
      message: `Сеанс #${result.id} изменён: «${result.film.title}»`,
    });
    return result;
  }

  async remove(id: number) {
    const result = await this.prisma.session.delete({
      where: { id },
    });
    this.eventBus.next({
      action: 'deleted',
      sessionId: id,
      message: `Сеанс #${id} удалён`,
    });
    return result;
  }

  async findAllHalls() {
    return this.prisma.hall.findMany({ orderBy: { name: 'asc' } });
  }

  async findOneOrFail(id: number) {
    const session = await this.findOne(id);
    if (!session) throw new NotFoundException(`Сеанс #${id} не найден`);
    return session;
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.session.findMany({
        skip,
        take: limit,
        include: { film: true, hall: true },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.session.count(),
    ]);
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findTickets(sessionId: number) {
    await this.findOneOrFail(sessionId);
    return this.prisma.ticket.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { seat: 'asc' },
    });
  }
}
