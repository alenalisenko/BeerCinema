import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString } from 'class-validator';

@InputType()
export class CreateTicketInput {
  @Field(() => Int, { description: 'ID сеанса' })
  @IsInt()
  sessionId: number;

  @Field(() => Int, { description: 'ID пользователя' })
  @IsInt()
  userId: number;

  @Field({ description: 'Номер места (например A1, B12)' })
  @IsString()
  seat: string;
}
