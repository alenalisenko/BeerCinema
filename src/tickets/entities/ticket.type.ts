import { ObjectType, Field, Int, GraphQLISODateTime, registerEnumType } from '@nestjs/graphql';
import { TicketStatus } from '@prisma/client';

registerEnumType(TicketStatus, {
  name: 'TicketStatus',
  description: 'Статус билета',
  valuesMap: {
    RESERVED: { description: 'Забронирован' },
    PAID: { description: 'Оплачен' },
    CANCELLED: { description: 'Отменён' },
  },
});

@ObjectType()
export class TicketType {
  @Field(() => Int, { description: 'ID билета' })
  id: number;

  @Field(() => Int, { description: 'ID сеанса' })
  sessionId: number;

  @Field(() => Int, { description: 'ID пользователя' })
  userId: number;

  @Field({ description: 'Номер места (например A1, B12)' })
  seat: string;

  @Field(() => TicketStatus, { description: 'Статус билета' })
  status: TicketStatus;

  @Field(() => GraphQLISODateTime, { description: 'Дата создания' })
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { description: 'Дата обновления' })
  updatedAt: Date;
}
