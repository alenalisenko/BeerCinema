import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('email') email?: string) {
    if (email) {
      return this.usersService.findByEmail(email);
    }
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() body: {
    email: string;
    name: string;
    password: string;
    role?: Role;
  }) {
    return this.usersService.create(body);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{
      email: string;
      name: string;
      password: string;
      role: Role;
    }>,
  ) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
