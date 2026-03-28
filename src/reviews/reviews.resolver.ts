import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewType } from './entities/review.type';
import { PaginatedReviews } from './entities/paginated-reviews.type';
import { FilmType } from '../films/entities/film.type';
import { UserType } from '../users/entities/user.type';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';

@Resolver(() => ReviewType)
export class ReviewsResolver {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => PaginatedReviews, { name: 'reviews', description: 'Список отзывов с пагинацией' })
  findAll(
    @Args('page', { type: () => Int, defaultValue: 1, description: 'Номер страницы' }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10, description: 'Записей на странице' }) limit: number,
  ) {
    return this.reviewsService.findAllPaginated(page, limit);
  }

  @Query(() => ReviewType, { name: 'review', nullable: true, description: 'Отзыв по ID' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.reviewsService.findOneOrFail(id);
  }

  @Mutation(() => ReviewType, { description: 'Создать отзыв' })
  createReview(@Args('input') input: CreateReviewInput) {
    return this.reviewsService.create(input);
  }

  @Mutation(() => ReviewType, { description: 'Обновить отзыв' })
  updateReview(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateReviewInput,
  ) {
    return this.reviewsService.update(id, input);
  }

  @Mutation(() => ReviewType, { description: 'Удалить отзыв' })
  removeReview(@Args('id', { type: () => Int }) id: number) {
    return this.reviewsService.remove(id);
  }

  @ResolveField('film', () => FilmType, { description: 'Фильм отзыва' })
  getFilm(@Parent() review: ReviewType) {
    return this.prisma.film.findUnique({ where: { id: review.filmId } });
  }

  @ResolveField('user', () => UserType, { description: 'Автор отзыва' })
  getUser(@Parent() review: ReviewType) {
    return this.prisma.user.findUnique({ where: { id: review.userId } });
  }
}
