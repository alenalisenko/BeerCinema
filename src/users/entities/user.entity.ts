import { ApiProperty } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Алёна' })
  name: string;

  @ApiProperty({ example: 'CLIENT', enum: ['CLIENT', 'ADMIN', 'MANAGER'] })
  role: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class PaginatedUsersEntity {
  @ApiProperty({ type: [UserEntity] })
  data: UserEntity[];

  @ApiProperty({ example: 15 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 2 })
  totalPages: number;
}
