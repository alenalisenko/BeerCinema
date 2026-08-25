import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { SessionUser } from './session-user';

// Достает пользователя из сессии (null для гостя)
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser | null => {
    const req = context.switchToHttp().getRequest<Request>();
    return req.session?.user ?? null;
  },
);
