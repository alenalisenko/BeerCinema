import { Module } from '@nestjs/common';
import { FilmsService } from './films.service';
import { FilmsController } from './films.controller';

@Module({
  providers: [FilmsService],
  controllers: [FilmsController],
  exports: [FilmsService],
})
export class FilmsModule {}
