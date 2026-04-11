import { IsInt, IsString, IsOptional, IsEnum, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ example: 1, description: 'ID сеанса' })
  @IsInt()
  @Min(1)
  sessionId: number;

  @ApiProperty({ example: 1, description: 'ID пользователя' })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ example: 'A1', description: 'Номер места' })
  @IsString()
  @IsNotEmpty()
  seat: string;

  @ApiPropertyOptional({ enum: TicketStatus, default: TicketStatus.RESERVED })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
