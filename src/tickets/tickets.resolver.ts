import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketType } from './entities/ticket.type';
import { PaginatedTickets } from './entities/paginated-tickets.type';
import { SessionType } from '../sessions/entities/session.type';
import { UserType } from '../users/entities/user.type';
import { CreateTicketInput } from './dto/create-ticket.input';

@Resolver(() => TicketType)
export class TicketsResolver {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => PaginatedTickets, { name: 'tickets', description: 'Список билетов с пагинацией' })
  findAll(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    return this.ticketsService.findAllPaginated(page, limit);
  }

  @Query(() => TicketType, { name: 'ticket', nullable: true, description: 'Билет по ID' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.ticketsService.findOneOrFail(id);
  }

  @Mutation(() => TicketType, { description: 'Создать билет (забронировать место)' })
  createTicket(@Args('input') input: CreateTicketInput) {
    return this.ticketsService.create(input);
  }

  @Mutation(() => TicketType, { description: 'Оплатить билет' })
  payTicket(@Args('id', { type: () => Int }) id: number) {
    return this.ticketsService.updateStatus(id, 'PAID');
  }

  @Mutation(() => TicketType, { description: 'Отменить билет' })
  cancelTicket(@Args('id', { type: () => Int }) id: number) {
    return this.ticketsService.updateStatus(id, 'CANCELLED');
  }

  @Mutation(() => TicketType, { description: 'Вернуть билет в статус "Забронирован"' })
  reserveTicket(@Args('id', { type: () => Int }) id: number) {
    return this.ticketsService.updateStatus(id, 'RESERVED');
  }

  @Mutation(() => TicketType, { description: 'Удалить билет' })
  removeTicket(@Args('id', { type: () => Int }) id: number) {
    return this.ticketsService.remove(id);
  }

  @ResolveField('session', () => SessionType, { description: 'Сеанс билета' })
  getSession(@Parent() ticket: TicketType) {
    return this.prisma.session.findUnique({ where: { id: ticket.sessionId } });
  }

  @ResolveField('user', () => UserType, { description: 'Владелец билета' })
  getUser(@Parent() ticket: TicketType) {
    return this.prisma.user.findUnique({ where: { id: ticket.userId } });
  }
}
