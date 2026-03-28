import { ObjectType, Field, Int, Float, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class SessionType {
  @Field(() => Int, { description: 'ID сеанса' })
  id: number;

  @Field(() => Int, { description: 'ID фильма' })
  filmId: number;

  @Field(() => Int, { description: 'ID зала' })
  hallId: number;

  @Field(() => GraphQLISODateTime, { description: 'Время начала' })
  startTime: Date;

  @Field(() => GraphQLISODateTime, { description: 'Время конца' })
  endTime: Date;

  @Field(() => Float, { description: 'Цена билета в рублях' })
  price: number;

  @Field(() => GraphQLISODateTime, { description: 'Дата создания' })
  createdAt: Date;
}
