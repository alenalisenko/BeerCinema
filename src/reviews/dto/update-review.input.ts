import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

@InputType()
export class UpdateReviewInput {
  @Field(() => Int, { nullable: true, description: 'Оценка от 1 до 5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @Field({ nullable: true, description: 'Текст отзыва' })
  @IsOptional()
  @IsString()
  comment?: string;
}
