import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Ограничивает маршрут перечисленными ролями (используется вместе с PageAuthGuard)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
