import { IsString, IsInt, IsOptional, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFilmDto {
  @ApiProperty({ example: 'Брат 2', description: 'Название фильма' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Криминальная драма о братьях', description: 'Описание фильма' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 122, description: 'Длительность в минутах' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: 'Драма', description: 'Жанр фильма' })
  @IsString()
  @IsNotEmpty()
  genre: string;

  @ApiPropertyOptional({ example: 'https://example.com/poster.jpg', description: 'URL постера (если не загружается файл)' })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiProperty({ example: 2000, description: 'Год выпуска (1888–2100)' })
  @IsInt()
  @Min(1888)
  @Max(2100)
  releaseYear: number;

  @ApiPropertyOptional({ example: 4.5, description: 'Рейтинг от 1.0 до 5.0' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
