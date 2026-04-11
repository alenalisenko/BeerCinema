import { IsInt, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: 1, description: 'ID фильма' })
  @IsInt()
  @Min(1)
  filmId: number;

  @ApiProperty({ example: 1, description: 'ID зала' })
  @IsInt()
  @Min(1)
  hallId: number;

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-03-15T11:00:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: 350, description: 'Цена билета в рублях' })
  @IsNumber()
  @Min(0)
  price: number;
}
