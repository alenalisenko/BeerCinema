import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { FilmsService } from './films.service';

@Controller('api/films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Get()
  findAll() {
    return this.filmsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.findOne(id);
  }

  @Post()
  create(@Body() body: {
    title: string;
    description: string;
    duration: number;
    genre: string;
    posterUrl: string;
    releaseYear: number;
    rating?: number;
  }) {
    return this.filmsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{
      title: string;
      description: string;
      duration: number;
      genre: string;
      posterUrl: string;
      releaseYear: number;
      rating: number;
    }>,
  ) {
    return this.filmsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.remove(id);
  }
}
