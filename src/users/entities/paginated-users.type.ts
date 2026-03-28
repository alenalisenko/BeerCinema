import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserType } from './user.type';

@ObjectType()
export class PaginatedUsers {
  @Field(() => [UserType], { description: 'Список пользователей' })
  data: UserType[];

  @Field(() => Int, { description: 'Всего записей' })
  total: number;

  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Записей на странице' })
  limit: number;

  @Field(() => Int, { description: 'Всего страниц' })
  totalPages: number;
}
