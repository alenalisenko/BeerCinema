import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Role = 'CLIENT' | 'ADMIN' | 'MANAGER';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        tickets: {
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
        },
        reviews: {
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
        },
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: Role;
  }) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(id: number, data: Partial<{
    email: string;
    name: string;
    password: string;
    role: Role;
  }>) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  async findOneOrFail(id: number) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`Пользователь #${id} не найден`);
    return user;
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findTickets(userId: number) {
    await this.findOneOrFail(userId);
    return this.prisma.ticket.findMany({
      where: { userId },
      include: { session: { include: { film: true, hall: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReviews(userId: number) {
    await this.findOneOrFail(userId);
    return this.prisma.review.findMany({
      where: { userId },
      include: { film: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
