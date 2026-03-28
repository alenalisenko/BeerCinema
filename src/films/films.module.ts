import { Module } from '@nestjs/common';
import { FilmsService } from './films.service';
import { FilmsController } from './films.controller';
import { FilmsApiController } from './films.api.controller';
import { FilmsResolver } from './films.resolver';

@Module({
  providers: [FilmsService, FilmsResolver],
  controllers: [FilmsController, FilmsApiController],
  exports: [FilmsService],
})
export class FilmsModule {}
