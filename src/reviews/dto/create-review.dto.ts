import { IsInt, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 1, description: 'ID фильма' })
  @IsInt()
  filmId: number;

  @ApiProperty({ example: 1, description: 'ID пользователя' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 5, description: 'Оценка от 1 до 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Отличный фильм!' })
  @IsString()
  comment: string;
}
