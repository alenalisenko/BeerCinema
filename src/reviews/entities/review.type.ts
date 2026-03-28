import { ObjectType, Field, Int, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class ReviewType {
  @Field(() => Int, { description: 'ID отзыва' })
  id: number;

  @Field(() => Int, { description: 'ID фильма' })
  filmId: number;

  @Field(() => Int, { description: 'ID пользователя' })
  userId: number;

  @Field(() => Int, { description: 'Оценка от 1 до 5' })
  rating: number;

  @Field({ description: 'Текст отзыва' })
  comment: string;

  @Field(() => GraphQLISODateTime, { description: 'Дата создания' })
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'Дата обновления' })
  updatedAt: Date;
}
