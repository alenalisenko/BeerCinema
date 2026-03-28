import { IsInt, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ example: 1, description: 'ID сеанса' })
  @IsInt()
  sessionId: number;

  @ApiProperty({ example: 1, description: 'ID пользователя' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 'A1', description: 'Номер места' })
  @IsString()
  seat: string;

  @ApiPropertyOptional({ enum: TicketStatus, default: TicketStatus.RESERVED })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
