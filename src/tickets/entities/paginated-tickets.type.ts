import { ObjectType, Field, Int } from '@nestjs/graphql';
import { TicketType } from './ticket.type';

@ObjectType()
export class PaginatedTickets {
  @Field(() => [TicketType], { description: 'Список билетов' })
  data: TicketType[];

  @Field(() => Int, { description: 'Всего записей' })
  total: number;

  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Записей на странице' })
  limit: number;

  @Field(() => Int, { description: 'Всего страниц' })
  totalPages: number;
}
