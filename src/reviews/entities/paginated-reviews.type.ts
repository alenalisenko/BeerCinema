import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ReviewType } from './review.type';

@ObjectType()
export class PaginatedReviews {
  @Field(() => [ReviewType], { description: 'Список отзывов' })
  data: ReviewType[];

  @Field(() => Int, { description: 'Всего записей' })
  total: number;

  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Записей на странице' })
  limit: number;

  @Field(() => Int, { description: 'Всего страниц' })
  totalPages: number;
}
