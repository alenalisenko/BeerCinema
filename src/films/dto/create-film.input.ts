import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsString, IsInt, IsOptional, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class CreateFilmInput {
  @Field({ description: 'Название фильма' })
  @IsString()
  title: string;

  @Field({ description: 'Описание фильма' })
  @IsString()
  description: string;

  @Field(() => Int, { description: 'Длительность в минутах' })
  @IsInt()
  @Min(1)
  duration: number;

  @Field({ description: 'Жанр' })
  @IsString()
  genre: string;

  @Field({ nullable: true, description: 'URL постера' })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @Field(() => Int, { description: 'Год выхода' })
  @IsInt()
  @Min(1888)
  releaseYear: number;

  @Field(() => Float, { nullable: true, description: 'Рейтинг от 1.0 до 5.0' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
