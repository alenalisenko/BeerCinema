import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

@InputType()
export class CreateUserInput {
  @Field({ description: 'Email адрес' })
  @IsEmail()
  email: string;

  @Field({ description: 'Имя пользователя' })
  @IsString()
  name: string;

  @Field({ description: 'Пароль (минимум 6 символов)' })
  @IsString()
  @MinLength(6)
  password: string;

  @Field(() => Role, { nullable: true, description: 'Роль (по умолчанию CLIENT)' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
