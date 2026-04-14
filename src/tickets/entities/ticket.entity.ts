import { ApiProperty } from '@nestjs/swagger';

export class TicketEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  sessionId: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'A5' })
  seat: string;

  @ApiProperty({ example: 'RESERVED', enum: ['RESERVED', 'PAID', 'CANCELLED'] })
  status: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class PaginatedTicketsEntity {
  @ApiProperty({ type: [TicketEntity] })
  data: TicketEntity[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
