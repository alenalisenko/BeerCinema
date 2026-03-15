import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('api/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findAll(@Query('filmId') filmId?: string, @Query('userId') userId?: string) {
    if (filmId) {
      return this.reviewsService.findByFilm(parseInt(filmId));
    }
    if (userId) {
      return this.reviewsService.findByUser(parseInt(userId));
    }
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Post()
  create(@Body() body: {
    filmId: number;
    userId: number;
    rating: number;
    comment: string;
  }) {
    return this.reviewsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{
      rating: number;
      comment: string;
    }>,
  ) {
    return this.reviewsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.remove(id);
  }
}
