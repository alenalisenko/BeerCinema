import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketsApiController } from './tickets.api.controller';
import { TicketsResolver } from './tickets.resolver';

@Module({
  providers: [TicketsService, TicketsResolver],
  controllers: [TicketsController, TicketsApiController],
})
export class TicketsModule {}
