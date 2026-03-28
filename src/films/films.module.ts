import { Module } from '@nestjs/common';
import { FilmsService } from './films.service';
import { FilmsController } from './films.controller';
import { FilmsApiController } from './films.api.controller';

@Module({
  providers: [FilmsService],
  controllers: [FilmsController, FilmsApiController],
  exports: [FilmsService],
})
export class FilmsModule {}
