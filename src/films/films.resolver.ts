import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { FilmsService } from './films.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilmType } from './entities/film.type';
import { PaginatedFilms } from './entities/paginated-films.type';
import { SessionType } from '../sessions/entities/session.type';
import { ReviewType } from '../reviews/entities/review.type';
import { CreateFilmInput } from './dto/create-film.input';
import { UpdateFilmInput } from './dto/update-film.input';

@Resolver(() => FilmType)
export class FilmsResolver {
  constructor(
    private readonly filmsService: FilmsService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => PaginatedFilms, { name: 'films', description: 'Список фильмов с пагинацией' })
  findAll(
    @Args('page', { type: () => Int, defaultValue: 1, description: 'Номер страницы' }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10, description: 'Записей на странице' }) limit: number,
  ) {
    return this.filmsService.findAllPaginated(page, limit);
  }

  @Query(() => FilmType, { name: 'film', nullable: true, description: 'Фильм по ID' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.filmsService.findOneOrFail(id);
  }

  @Mutation(() => FilmType, { description: 'Создать фильм' })
  createFilm(@Args('input') input: CreateFilmInput) {
    return this.filmsService.create(input);
  }

  @Mutation(() => FilmType, { description: 'Обновить фильм' })
  updateFilm(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateFilmInput,
  ) {
    return this.filmsService.update(id, input);
  }

  @Mutation(() => FilmType, { description: 'Удалить фильм' })
  removeFilm(@Args('id', { type: () => Int }) id: number) {
    return this.filmsService.remove(id);
  }

  @ResolveField('sessions', () => [SessionType], { description: 'Сеансы фильма' })
  getSessions(@Parent() film: FilmType) {
    return this.prisma.session.findMany({
      where: { filmId: film.id },
      orderBy: { startTime: 'asc' },
    });
  }

  @ResolveField('reviews', () => [ReviewType], { description: 'Отзывы о фильме' })
  getReviews(@Parent() film: FilmType) {
    return this.prisma.review.findMany({
      where: { filmId: film.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
