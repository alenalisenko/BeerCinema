import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilmEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Брат 2' })
  title: string;

  @ApiProperty({ example: 'Криминальная драма о братьях' })
  description: string;

  @ApiProperty({ example: 122 })
  duration: number;

  @ApiProperty({ example: 'Драма' })
  genre: string;

  @ApiProperty({ example: 'https://example.com/poster.jpg' })
  posterUrl: string;

  @ApiProperty({ example: 2000 })
  releaseYear: number;

  @ApiPropertyOptional({ example: 4.5 })
  rating?: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class PaginatedFilmsEntity {
  @ApiProperty({ type: [FilmEntity] })
  data: FilmEntity[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
