import { ObjectType, Field, Int } from '@nestjs/graphql';
import { SessionType } from './session.type';

@ObjectType()
export class PaginatedSessions {
  @Field(() => [SessionType], { description: 'Список сеансов' })
  data: SessionType[];

  @Field(() => Int, { description: 'Всего записей' })
  total: number;

  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Записей на странице' })
  limit: number;

  @Field(() => Int, { description: 'Всего страниц' })
  totalPages: number;
}
