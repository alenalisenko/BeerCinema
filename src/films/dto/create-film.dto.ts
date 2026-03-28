import { IsString, IsInt, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFilmDto {
  @ApiProperty({ example: 'Брат 2' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Криминальная драма о братьях' })
  @IsString()
  description: string;

  @ApiProperty({ example: 122, description: 'Длительность в минутах' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: 'Драма' })
  @IsString()
  genre: string;

  @ApiProperty({ example: 'https://example.com/poster.jpg' })
  @IsString()
  posterUrl: string;

  @ApiProperty({ example: 2000 })
  @IsInt()
  @Min(1888)
  releaseYear: number;

  @ApiPropertyOptional({ example: 4.5, description: 'Рейтинг от 1.0 до 5.0' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
