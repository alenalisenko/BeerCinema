import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { TicketsService } from './tickets.service';

type TicketStatus = 'RESERVED' | 'PAID' | 'CANCELLED';

@Controller('api/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll(@Query('userId') userId?: string, @Query('sessionId') sessionId?: string) {
    if (userId) {
      return this.ticketsService.findByUser(parseInt(userId));
    }
    if (sessionId) {
      return this.ticketsService.findBySession(parseInt(sessionId));
    }
    return this.ticketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  create(@Body() body: {
    sessionId: number;
    userId: number;
    seat: string;
    status?: TicketStatus;
  }) {
    return this.ticketsService.create(body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: TicketStatus,
  ) {
    return this.ticketsService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }
}
