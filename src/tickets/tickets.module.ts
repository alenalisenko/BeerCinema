import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketsApiController } from './tickets.api.controller';

@Module({
  providers: [TicketsService],
  controllers: [TicketsController, TicketsApiController],
})
export class TicketsModule {}
