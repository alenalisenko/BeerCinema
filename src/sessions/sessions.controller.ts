import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('api/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll(@Query('filmId') filmId?: string, @Query('date') date?: string) {
    if (filmId) {
      return this.sessionsService.findByFilm(parseInt(filmId));
    }
    if (date) {
      return this.sessionsService.findByDate(new Date(date));
    }
    return this.sessionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOne(id);
  }

  @Post()
  create(@Body() body: {
    filmId: number;
    hallId: number;
    startTime: string;
    endTime: string;
    price: number;
  }) {
    return this.sessionsService.create({
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{
      filmId: number;
      hallId: number;
      startTime: string;
      endTime: string;
      price: number;
    }>,
  ) {
    const data: any = { ...body };
    if (body.startTime) data.startTime = new Date(body.startTime);
    if (body.endTime) data.endTime = new Date(body.endTime);
    return this.sessionsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.remove(id);
  }
}
