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

  // Смена имени и пароля в своем профиле; для смены пароля нужен текущий
  async updateProfile(
    userId: number,
    data: { name?: string; currentPassword?: string; newPassword?: string },
  ): Promise<SessionUser> {
    const updates: { name?: string; password?: string } = {};
    if (data.name) updates.name = data.name;

    if (data.newPassword) {
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
      if (!data.currentPassword || !(await bcrypt.compare(data.currentPassword, user.password))) {
        throw new UnauthorizedException('Текущий пароль указан неверно');
      }
      updates.password = await bcrypt.hash(data.newPassword, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updates,
    });
    return { id: updated.id, email: updated.email, name: updated.name, role: updated.role };
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
