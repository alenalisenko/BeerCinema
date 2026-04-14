import { ApiProperty } from '@nestjs/swagger';

export class SessionEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  filmId: number;

  @ApiProperty({ example: 1 })
  hallId: number;

  @ApiProperty({ example: '2026-04-15T10:00:00.000Z' })
  startTime: Date;

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z' })
  endTime: Date;

  @ApiProperty({ example: 350 })
  price: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class PaginatedSessionsEntity {
  @ApiProperty({ type: [SessionEntity] })
  data: SessionEntity[];

  @ApiProperty({ example: 20 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 2 })
  totalPages: number;
}
