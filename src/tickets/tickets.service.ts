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

  async create(data: {
    sessionId: number;
    userId: number;
    seat: string;
    status?: TicketStatus;
  }) {
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
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
