import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionUser } from './session-user';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // Проверяет пару email/пароль, возвращает данные для сессии
  async validateUser(email: string, password: string): Promise<SessionUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  // Регистрация всегда создает клиента, роли выдает администратор
  async register(data: { email: string; name: string; password: string }): Promise<SessionUser> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: await bcrypt.hash(data.password, 10),
        role: Role.CLIENT,
      },
    });
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
