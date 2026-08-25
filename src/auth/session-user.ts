import { Role } from '@prisma/client';

// Данные пользователя, которые хранятся в сессии после входа
export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}
