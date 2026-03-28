import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, Min, Max } from 'class-validator';

@InputType()
export class CreateReviewInput {
  @Field(() => Int, { description: 'ID фильма' })
  @IsInt()
  filmId: number;

  @Field(() => Int, { description: 'ID пользователя' })
  @IsInt()
  userId: number;

  @Field(() => Int, { description: 'Оценка от 1 до 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Field({ description: 'Текст отзыва' })
  @IsString()
  comment: string;
}
