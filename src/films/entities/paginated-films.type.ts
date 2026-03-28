import { ObjectType, Field, Int } from '@nestjs/graphql';
import { FilmType } from './film.type';

@ObjectType()
export class PaginatedFilms {
  @Field(() => [FilmType], { description: 'Список фильмов' })
  data: FilmType[];

  @Field(() => Int, { description: 'Всего записей' })
  total: number;

  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Записей на странице' })
  limit: number;

  @Field(() => Int, { description: 'Всего страниц' })
  totalPages: number;
}
