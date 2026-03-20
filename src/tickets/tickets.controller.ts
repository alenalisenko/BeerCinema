import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, Render, Redirect } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';

type TicketStatus = 'RESERVED' | 'PAID' | 'CANCELLED';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly prisma: PrismaService,
  ) {}

  private getUser(auth?: string) {
    return auth === 'true' ? { name: 'Алёна Лисенко' } : null;
  }

  // GET /tickets — список билетов
  @Get()
  @Render('tickets/index')
  async index(@Query('auth') auth?: string, @Query('userId') userId?: string, @Query('sessionId') sessionId?: string) {
    const tickets = userId
      ? await this.ticketsService.findByUser(parseInt(userId))
      : sessionId
        ? await this.ticketsService.findBySession(parseInt(sessionId))
        : await this.ticketsService.findAll();
    return { title: 'Билеты', user: this.getUser(auth), tickets };
  }

  // GET /tickets/add — форма создания (ВАЖНО: до /:id)
  @Get('add')
  @Render('tickets/add')
  async addForm(@Query('auth') auth?: string) {
    const sessions = await this.prisma.session.findMany({
      include: { film: true, hall: true },
      orderBy: { startTime: 'asc' },
    });
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    return { title: 'Добавить билет', user: this.getUser(auth), sessions, users };
  }

  // GET /tickets/:id/edit — форма смены статуса
  @Get(':id/edit')
  @Render('tickets/edit')
  async editForm(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const ticket = await this.ticketsService.findOne(id);
    const statuses: TicketStatus[] = ['RESERVED', 'PAID', 'CANCELLED'];
    return { title: 'Изменить статус', user: this.getUser(auth), ticket, statuses };
  }

  // GET /tickets/:id — страница билета
  @Get(':id')
  @Render('tickets/show')
  async show(@Param('id', ParseIntPipe) id: number, @Query('auth') auth?: string) {
    const ticket = await this.ticketsService.findOne(id);
    return { title: `Билет #${id}`, user: this.getUser(auth), ticket };
  }

  // POST /tickets — создать → редирект на /tickets
  @Post()
  @Redirect('/tickets', 302)
  async create(@Body() body: any) {
    await this.ticketsService.create({
      sessionId: parseInt(body.sessionId),
      userId: parseInt(body.userId),
      seat: body.seat,
      status: body.status as TicketStatus || 'RESERVED',
    });
  }

  // POST /tickets/:id/update — обновить статус → редирект на /tickets/:id
  @Post(':id/update')
  @Redirect()
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    await this.ticketsService.updateStatus(id, body.status as TicketStatus);
    return { url: `/tickets/${id}`, statusCode: 302 };
  }

  // POST /tickets/:id/delete — удалить → редирект на /tickets
  @Post(':id/delete')
  @Redirect('/tickets', 302)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.ticketsService.remove(id);
  }
}
