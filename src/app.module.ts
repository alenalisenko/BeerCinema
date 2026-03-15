import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FilmsModule } from './films/films.module';
import { SessionsModule } from './sessions/sessions.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [PrismaModule, FilmsModule, SessionsModule, UsersModule, TicketsModule, ReviewsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
