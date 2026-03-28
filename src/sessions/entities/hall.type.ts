import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class HallType {
  @Field(() => Int, { description: 'ID зала' })
  id: number;

  @Field({ description: 'Название зала' })
  name: string;

  @Field(() => Int, { description: 'Вместимость зала' })
  capacity: number;

  @Field({ nullable: true, description: 'Описание зала' })
  description?: string;
}
