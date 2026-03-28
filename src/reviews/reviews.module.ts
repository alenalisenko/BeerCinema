import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsApiController } from './reviews.api.controller';

@Module({
  providers: [ReviewsService],
  controllers: [ReviewsController, ReviewsApiController],
})
export class ReviewsModule {}
