import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionType } from './entities/session.type';
import { PaginatedSessions } from './entities/paginated-sessions.type';
import { HallType } from './entities/hall.type';
import { FilmType } from '../films/entities/film.type';
import { TicketType } from '../tickets/entities/ticket.type';
import { CreateSessionInput } from './dto/create-session.input';
import { UpdateSessionInput } from './dto/update-session.input';

@Resolver(() => SessionType)
export class SessionsResolver {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => PaginatedSessions, { name: 'sessions', description: 'Список сеансов с пагинацией' })
  findAll(
    @Args('page', { type: () => Int, defaultValue: 1, description: 'Номер страницы' }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10, description: 'Записей на странице' }) limit: number,
  ) {
    return this.sessionsService.findAllPaginated(page, limit);
  }

  @Query(() => SessionType, { name: 'session', nullable: true, description: 'Сеанс по ID' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.sessionsService.findOneOrFail(id);
  }

  @Mutation(() => SessionType, { description: 'Создать сеанс' })
  createSession(@Args('input') input: CreateSessionInput) {
    return this.sessionsService.create({
      ...input,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
    });
  }

  @Mutation(() => SessionType, { description: 'Обновить сеанс' })
  updateSession(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateSessionInput,
  ) {
    return this.sessionsService.update(id, {
      ...input,
      startTime: input.startTime ? new Date(input.startTime) : undefined,
      endTime: input.endTime ? new Date(input.endTime) : undefined,
    });
  }

  @Mutation(() => SessionType, { description: 'Удалить сеанс' })
  removeSession(@Args('id', { type: () => Int }) id: number) {
    return this.sessionsService.remove(id);
  }

  @ResolveField('film', () => FilmType, { description: 'Фильм сеанса' })
  getFilm(@Parent() session: SessionType) {
    return this.prisma.film.findUnique({ where: { id: session.filmId } });
  }

  @ResolveField('hall', () => HallType, { description: 'Зал сеанса' })
  getHall(@Parent() session: SessionType) {
    return this.prisma.hall.findUnique({ where: { id: session.hallId } });
  }

  @ResolveField('tickets', () => [TicketType], { description: 'Билеты на сеанс' })
  getTickets(@Parent() session: SessionType) {
    return this.prisma.ticket.findMany({
      where: { sessionId: session.id },
      orderBy: { seat: 'asc' },
    });
  }
}
