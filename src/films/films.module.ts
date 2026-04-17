import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { FilmsService } from './films.service';
import { FilmsController } from './films.controller';
import { FilmsApiController } from './films.api.controller';
import { FilmsResolver } from './films.resolver';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    CacheModule.register({ ttl: 10_000, max: 100 }), // 10 секунд in-memory кэш
    StorageModule,
  ],
  providers: [FilmsService, FilmsResolver],
  controllers: [FilmsController, FilmsApiController],
  exports: [FilmsService],
})
export class FilmsModule {}
