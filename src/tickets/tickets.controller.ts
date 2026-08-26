import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, Render, Redirect, Res, UseGuards, ForbiddenException, HttpException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { PageAuthGuard } from '../auth/page-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionUser } from '../auth/session-user';

type TicketStatus = 'RESERVED' | 'PAID' | 'CANCELLED';

@ApiExcludeController()
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly prisma: PrismaService,
  ) {}

  private isManager(user: SessionUser | null): boolean {
    return !!user && (user.role === 'MANAGER' || user.role === 'ADMIN');
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  // Клиент может работать только со своими билетами
  private async findOwnOrFail(id: number, user: SessionUser) {
    const ticket = await this.ticketsService.findOneOrFail(id);
    if (!this.isManager(user) && ticket.userId !== user.id) {
      throw new ForbiddenException('Это чужой билет');
    }
    return ticket;
  }

  private async loadFormData() {
    const sessionsRaw = await this.prisma.session.findMany({
      include: { film: true, hall: true },
      orderBy: { startTime: 'asc' },
    });
    const sessions = sessionsRaw.map((s) => ({
      ...s,
      startTimeFormatted: this.formatDateTime(s.startTime),
    }));
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    return { sessions, users };
  }

  // GET /tickets — менеджер видит все, клиент только свои
  @Get()
  @Render('tickets/index')
  async index(@CurrentUser() user: SessionUser | null, @Query('userId') userId?: string, @Query('sessionId') sessionId?: string) {
    let tickets: unknown[] = [];
    if (this.isManager(user)) {
      tickets = userId
        ? await this.ticketsService.findByUser(parseInt(userId))
        : sessionId
          ? await this.ticketsService.findBySession(parseInt(sessionId))
          : await this.ticketsService.findAll();
    } else if (user) {
      tickets = await this.ticketsService.findByUser(user.id);
    }
    tickets = (tickets as any[]).map((t) => ({
      ...t,
      session: t.session
        ? { ...t.session, startTimeFormatted: this.formatDateTime(t.session.startTime) }
        : t.session,
    }));
    return {
      title: this.isManager(user) ? 'Билеты' : 'Мои билеты',
      mineOnly: !!user && !this.isManager(user),
      user,
      tickets,
    };
  }

  // GET /tickets/add — форма покупки (сеанс можно передать через ?sessionId=)
  @Get('add')
  @UseGuards(PageAuthGuard)
  @Render('tickets/add')
  async addForm(@CurrentUser() user: SessionUser | null, @Query('sessionId') sessionId?: string) {
    const { sessions, users } = await this.loadFormData();
    return {
      title: 'Покупка билета',
      user,
      sessions,
      users,
      selectedSessionId: sessionId ? parseInt(sessionId) : null,
    };
  }

  // GET /tickets/:id/edit — прямое редактирование статуса только для менеджеров
  @Get(':id/edit')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @Render('tickets/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const ticket = await this.ticketsService.findOne(id);
    const statuses: TicketStatus[] = ['RESERVED', 'PAID', 'CANCELLED'];
    return { title: 'Изменить статус', user, ticket, statuses };
  }

  // GET /tickets/:id — страница билета (владелец или менеджер)
  @Get(':id')
  @UseGuards(PageAuthGuard)
  @Render('tickets/show')
  async show(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const ticket = await this.findOwnOrFail(id, user!);
    return { title: `Билет #${id}`, user, ticket };
  }

  // POST /tickets — покупка: клиент всегда покупает себе со статусом RESERVED
  @Post()
  @UseGuards(PageAuthGuard)
  async create(
    @CurrentUser() user: SessionUser | null,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const manager = this.isManager(user);
    try {
      const ticket = await this.ticketsService.create({
        sessionId: parseInt(body.sessionId),
        userId: manager && body.userId ? parseInt(body.userId) : user!.id,
        seat: body.seat,
        status: manager ? (body.status as TicketStatus) || 'RESERVED' : 'RESERVED',
      });
      return res.redirect(`/tickets/${ticket.id}`);
    } catch (e) {
      // Место занято или сеанс не найден: показываем форму с ошибкой
      const message = e instanceof HttpException ? e.message : 'Не удалось купить билет';
      const { sessions, users } = await this.loadFormData();
      return res.render('tickets/add', {
        title: 'Покупка билета',
        user,
        sessions,
        users,
        selectedSessionId: body.sessionId ? parseInt(body.sessionId) : null,
        seat: body.seat,
        error: message,
      });
    }
  }

  // POST /tickets/:id/pay — оплатить бронь (владелец или менеджер)
  @Post(':id/pay')
  @UseGuards(PageAuthGuard)
  @Redirect()
  async pay(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const ticket = await this.findOwnOrFail(id, user!);
    if (ticket.status === 'RESERVED') {
      await this.ticketsService.updateStatus(id, 'PAID');
    }
    return { url: `/tickets/${id}`, statusCode: 302 };
  }

  // POST /tickets/:id/cancel — отменить билет (владелец или менеджер)
  @Post(':id/cancel')
  @UseGuards(PageAuthGuard)
  @Redirect()
  async cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser | null) {
    const ticket = await this.findOwnOrFail(id, user!);
    if (ticket.status !== 'CANCELLED') {
      await this.ticketsService.updateStatus(id, 'CANCELLED');
    }
    return { url: `/tickets/${id}`, statusCode: 302 };
  }

  // POST /tickets/:id/update — произвольная смена статуса только менеджерам
  @Post(':id/update')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @Redirect()
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    await this.ticketsService.updateStatus(id, body.status as TicketStatus);
    return { url: `/tickets/${id}`, statusCode: 302 };
  }

  // POST /tickets/:id/delete — удаление только менеджерам
  @Post(':id/delete')
  @UseGuards(PageAuthGuard)
  @Roles('MANAGER', 'ADMIN')
  @Redirect('/tickets', 302)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.ticketsService.remove(id);
  }
}
