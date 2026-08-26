import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type TicketStatus = 'RESERVED' | 'PAID' | 'CANCELLED';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.ticket.findMany({
      include: {
        session: {
          include: {
            film: true,
            hall: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            film: true,
            hall: true,
          },
        },
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

  async findByUser(userId: number) {
    return this.prisma.ticket.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            film: true,
            hall: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findBySession(sessionId: number) {
    return this.prisma.ticket.findMany({
      where: { sessionId },
      include: {
        session: {
          include: {
            film: true,
            hall: true,
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
        seat: 'asc',
      },
    });
  }

  // Сеанс существует, еще не начался, а места есть в схеме зала (ряды по 10)
  private async validatePurchase(sessionId: number, seats: string[]) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { hall: true },
    });
    if (!session) {
      throw new BadRequestException(`Сеанс #${sessionId} не найден`);
    }
    if (session.startTime < new Date()) {
      throw new BadRequestException('Сеанс уже начался, билеты не продаются');
    }

    const seatsPerRow = 10;
    const rows = Math.ceil(session.hall.capacity / seatsPerRow);
    for (const seat of seats) {
      const match = /^([A-Z])([0-9]{1,2})$/.exec(seat);
      const rowIndex = match ? match[1].charCodeAt(0) - 65 : -1;
      const num = match ? parseInt(match[2]) : 0;
      const seatIndex = rowIndex * seatsPerRow + num - 1;
      const valid =
        match &&
        rowIndex >= 0 && rowIndex < rows &&
        num >= 1 && num <= seatsPerRow &&
        seatIndex < session.hall.capacity;
      if (!valid) {
        throw new BadRequestException(
          `Места ${seat} нет в зале «${session.hall.name}» (${session.hall.capacity} мест)`,
        );
      }
    }
    return session;
  }

  async create(data: {
    sessionId: number;
    userId: number;
    seat: string;
    status?: TicketStatus;
  }) {
    await this.validatePurchase(data.sessionId, [data.seat]);

    // Проверяем, что место еще не занято
    const existingTicket = await this.prisma.ticket.findUnique({
      where: {
        sessionId_seat: {
          sessionId: data.sessionId,
          seat: data.seat,
        },
      },
    });

    if (existingTicket) {
      throw new BadRequestException(`Место ${data.seat} уже забронировано`);
    }

    return this.prisma.ticket.create({
      data,
      include: {
        session: {
          include: {
            film: true,
            hall: true,
          },
        },
      },
    });
  }

  // Покупка нескольких мест одним заказом
  async createMany(data: {
    sessionId: number;
    userId: number;
    seats: string[];
    status?: TicketStatus;
  }) {
    await this.validatePurchase(data.sessionId, data.seats);

    const taken = await this.prisma.ticket.findMany({
      where: {
        sessionId: data.sessionId,
        seat: { in: data.seats },
      },
      select: { seat: true },
    });
    if (taken.length > 0) {
      const seats = taken.map((t) => t.seat).join(', ');
      throw new BadRequestException(`Уже забронированы места: ${seats}`);
    }

    return this.prisma.$transaction(
      data.seats.map((seat) =>
        this.prisma.ticket.create({
          data: {
            sessionId: data.sessionId,
            userId: data.userId,
            seat,
            status: data.status ?? 'RESERVED',
          },
        }),
      ),
    );
  }

  async updateStatus(id: number, status: TicketStatus) {
    return this.prisma.ticket.update({
      where: { id },
      data: { status },
      include: {
        session: {
          include: {
            film: true,
            hall: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.ticket.delete({
      where: { id },
    });
  }

  async findOneOrFail(id: number) {
    const ticket = await this.findOne(id);
    if (!ticket) throw new NotFoundException(`Билет #${id} не найден`);
    return ticket;
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        skip,
        take: limit,
        include: {
          session: { include: { film: true, hall: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count(),
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
