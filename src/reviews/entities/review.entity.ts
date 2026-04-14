import { ApiProperty } from '@nestjs/swagger';

export class ReviewEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  filmId: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: 'Отличный фильм!' })
  comment: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class PaginatedReviewsEntity {
  @ApiProperty({ type: [ReviewEntity] })
  data: ReviewEntity[];

  @ApiProperty({ example: 30 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
