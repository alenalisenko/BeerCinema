import { ObjectType, Field, Int, GraphQLISODateTime, registerEnumType } from '@nestjs/graphql';
import { Role } from '@prisma/client';

registerEnumType(Role, {
  name: 'Role',
  description: 'Роль пользователя',
  valuesMap: {
    CLIENT: { description: 'Обычный пользователь' },
    ADMIN: { description: 'Администратор' },
    MANAGER: { description: 'Менеджер кинотеатра' },
  },
});

@ObjectType()
export class UserType {
  @Field(() => Int, { description: 'ID пользователя' })
  id: number;

  @Field({ description: 'Email адрес' })
  email: string;

  @Field({ description: 'Имя пользователя' })
  name: string;

  @Field(() => Role, { description: 'Роль пользователя' })
  role: Role;

  @Field(() => GraphQLISODateTime, { description: 'Дата регистрации' })
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'Дата обновления' })
  updatedAt: Date;
}
