import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserType } from './entities/user.type';
import { PaginatedUsers } from './entities/paginated-users.type';
import { TicketType } from '../tickets/entities/ticket.type';
import { ReviewType } from '../reviews/entities/review.type';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => PaginatedUsers, { name: 'users', description: 'Список пользователей с пагинацией' })
  findAll(
    @Args('page', { type: () => Int, defaultValue: 1, description: 'Номер страницы' }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10, description: 'Записей на странице' }) limit: number,
  ) {
    return this.usersService.findAllPaginated(page, limit);
  }

  @Query(() => UserType, { name: 'user', nullable: true, description: 'Пользователь по ID' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOneOrFail(id);
  }

  @Mutation(() => UserType, { description: 'Создать пользователя' })
  createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.create(input);
  }

  @Mutation(() => UserType, { description: 'Обновить пользователя' })
  updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateUserInput,
  ) {
    return this.usersService.update(id, input);
  }

  @Mutation(() => UserType, { description: 'Удалить пользователя' })
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }

  @ResolveField('tickets', () => [TicketType], { description: 'Билеты пользователя' })
  getTickets(@Parent() user: UserType) {
    return this.prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @ResolveField('reviews', () => [ReviewType], { description: 'Отзывы пользователя' })
  getReviews(@Parent() user: UserType) {
    return this.prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
