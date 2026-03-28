import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionsApiController } from './sessions.api.controller';
import { SessionsResolver } from './sessions.resolver';
import { FilmsModule } from '../films/films.module';

@Module({
  imports: [FilmsModule],
  providers: [SessionsService, SessionsResolver],
  controllers: [SessionsController, SessionsApiController],
  exports: [SessionsService],
})
export class SessionsModule {}
