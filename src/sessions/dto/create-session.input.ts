import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsInt, IsNumber, IsDateString, Min } from 'class-validator';

@InputType()
export class CreateSessionInput {
  @Field(() => Int, { description: 'ID фильма' })
  @IsInt()
  filmId: number;

  @Field(() => Int, { description: 'ID зала' })
  @IsInt()
  hallId: number;

  @Field({ description: 'Время начала (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @Field({ description: 'Время конца (ISO 8601)' })
  @IsDateString()
  endTime: string;

  @Field(() => Float, { description: 'Цена билета в рублях' })
  @IsNumber()
  @Min(0)
  price: number;
}
