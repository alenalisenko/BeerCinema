import { ObjectType, Field, Int, Float, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class FilmType {
  @Field(() => Int, { description: 'ID фильма' })
  id: number;

  @Field({ description: 'Название фильма' })
  title: string;

  @Field({ description: 'Описание фильма' })
  description: string;

  @Field(() => Int, { description: 'Длительность в минутах' })
  duration: number;

  @Field({ description: 'Жанр' })
  genre: string;

  @Field({ description: 'URL постера' })
  posterUrl: string;

  @Field(() => Int, { description: 'Год выхода' })
  releaseYear: number;

  @Field(() => Float, { nullable: true, description: 'Рейтинг от 1.0 до 5.0' })
  rating?: number;

  @Field(() => GraphQLISODateTime, { description: 'Дата создания' })
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'Дата обновления' })
  updatedAt: Date;
}
