# Лабораторная работа 4 — RESTful API и OpenAPI-спецификация

## Цель
Добавить к существующему MVC-приложению REST API с валидацией, пагинацией, обработкой ошибок и документацией Swagger.

MVC-контроллеры (лаба 3) **не трогаем** — добавляем новые API-контроллеры рядом.

---

## Шаг 1 — Установить зависимости

```bash
npm install @nestjs/swagger class-validator class-transformer
```

- `@nestjs/swagger` — генерация OpenAPI-документации
- `class-validator` — декораторы валидации (`@IsString`, `@IsInt`, `@Min` и т.д.)
- `class-transformer` — преобразование типов (`"42"` → `42`)

---

## Шаг 2 — Подключить Swagger и ValidationPipe в `main.ts`

В `src/main.ts` добавить:

```ts
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Глобальная валидация — возвращает 400 при неверных данных
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

// Swagger
const config = new DocumentBuilder()
  .setTitle('BeerCinema API')
  .setDescription('REST API для системы управления кинотеатром')
  .setVersion('1.0')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

После запуска документация будет по адресу: `http://localhost:3000/api/docs`

---

## Шаг 3 — Создать DTO-классы

Для каждой сущности создать два файла:
- `create-<entity>.dto.ts` — поля для создания (все обязательные)
- `update-<entity>.dto.ts` — те же поля, но все необязательные (`PartialType`)

### Структура файлов

```
src/
  films/
    dto/
      create-film.dto.ts
      update-film.dto.ts
  sessions/
    dto/
      create-session.dto.ts
      update-session.dto.ts
  tickets/
    dto/
      create-ticket.dto.ts
      update-ticket.dto.ts
  users/
    dto/
      create-user.dto.ts
      update-user.dto.ts
  reviews/
    dto/
      create-review.dto.ts
      update-review.dto.ts
```

### Пример `create-film.dto.ts`

```ts
import { IsString, IsInt, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFilmDto {
  @ApiProperty({ example: 'Брат 2' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Криминальная драма' })
  @IsString()
  description: string;

  @ApiProperty({ example: 122 })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: 'Драма' })
  @IsString()
  genre: string;

  @ApiProperty({ example: 'https://example.com/poster.jpg' })
  @IsString()
  posterUrl: string;

  @ApiProperty({ example: 2000 })
  @IsInt()
  @Min(1888)
  releaseYear: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
```

### Пример `update-film.dto.ts`

```ts
import { PartialType } from '@nestjs/swagger';
import { CreateFilmDto } from './create-film.dto';

export class UpdateFilmDto extends PartialType(CreateFilmDto) {}
// Все поля из CreateFilmDto становятся необязательными автоматически
```

---

## Шаг 4 — Создать API-контроллеры

Для каждого модуля создать файл `<entity>.api.controller.ts` рядом с MVC-контроллером.
Зарегистрировать его в `<entity>.module.ts` в массиве `controllers`.

### Маршруты (соблюдать REST)

| Метод | URL | Действие |
|-------|-----|----------|
| GET | /api/films | Список (с пагинацией) |
| GET | /api/films/:id | Один фильм |
| GET | /api/films/:id/sessions | Сеансы фильма |
| POST | /api/films | Создать |
| PATCH | /api/films/:id | Обновить |
| DELETE | /api/films/:id | Удалить |
| GET | /api/sessions | Список |
| GET | /api/sessions/:id | Один сеанс |
| GET | /api/sessions/:id/tickets | Билеты сеанса |
| POST | /api/sessions | Создать |
| PATCH | /api/sessions/:id | Обновить |
| DELETE | /api/sessions/:id | Удалить |
| GET | /api/tickets | Список |
| GET | /api/tickets/:id | Один билет |
| POST | /api/tickets | Создать |
| PATCH | /api/tickets/:id | Обновить |
| DELETE | /api/tickets/:id | Удалить |
| GET | /api/users | Список |
| GET | /api/users/:id | Один пользователь |
| GET | /api/users/:id/tickets | Билеты пользователя |
| GET | /api/users/:id/reviews | Отзывы пользователя |
| POST | /api/users | Создать |
| PATCH | /api/users/:id | Обновить |
| DELETE | /api/users/:id | Удалить |
| GET | /api/reviews | Список |
| GET | /api/reviews/:id | Один отзыв |
| POST | /api/reviews | Создать |
| PATCH | /api/reviews/:id | Обновить |
| DELETE | /api/reviews/:id | Удалить |

### Пример `films.api.controller.ts`

```ts
import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FilmsService } from './films.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';

@ApiTags('films')           // тег в Swagger — один модуль = один тег
@Controller('api/films')
export class FilmsApiController {
  constructor(private readonly filmsService: FilmsService) {}

  @Get()
  @ApiOperation({ summary: 'Список фильмов с пагинацией' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.filmsService.findAllPaginated(+page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Один фильм по ID' })
  @ApiResponse({ status: 404, description: 'Фильм не найден' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.findOne(id);  // сервис сам кинет NotFoundException
  }

  @Post()
  @ApiOperation({ summary: 'Создать фильм' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  create(@Body() dto: CreateFilmDto) {
    return this.filmsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить фильм' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFilmDto) {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)  // 204 — удалено, нет тела ответа
  @ApiOperation({ summary: 'Удалить фильм' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.filmsService.remove(id);
  }
}
```

---

## Шаг 5 — Обновить сервисы (добавить исключения)

Сервисы должны выбрасывать HTTP-исключения NestJS вместо возврата `null`.

```ts
import { NotFoundException } from '@nestjs/common';

async findOne(id: number) {
  const film = await this.prisma.film.findUnique({ where: { id } });
  if (!film) throw new NotFoundException(`Фильм #${id} не найден`);
  return film;
}
```

Это работает для обоих контроллеров: MVC увидит ошибку, API вернёт JSON `{ message, statusCode }`.

---

## Шаг 6 — Добавить пагинацию

В сервисах добавить метод `findAllPaginated`:

```ts
async findAllPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    this.prisma.film.findMany({ skip, take: limit, orderBy: { id: 'asc' } }),
    this.prisma.film.count(),
  ]);
  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### Заголовок Link (HATEOAS)

В контроллере добавить заголовок `Link` с URL предыдущей и следующей страниц:

```ts
import { Res } from '@nestjs/common';
import { Response } from 'express';

@Get()
async findAll(@Query('page') page = '1', @Query('limit') limit = '10', @Res({ passthrough: true }) res: Response) {
  const result = await this.filmsService.findAllPaginated(+page, +limit);
  const links = [];
  if (+page > 1) links.push(`</api/films?page=${+page - 1}&limit=${limit}>; rel="prev"`);
  if (+page < result.meta.totalPages) links.push(`</api/films?page=${+page + 1}&limit=${limit}>; rel="next"`);
  if (links.length) res.setHeader('Link', links.join(', '));
  return result;
}
```

---

## Шаг 7 — Создать ExceptionFilter

```
src/common/filters/prisma-exception.filter.ts
```

```ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Уже HTTP-исключение (NotFoundException и т.д.) — пробрасываем как есть
    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

    // Prisma: запись не найдена (P2025)
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: 404,
          message: 'Запись не найдена',
        });
      }
      // Prisma: нарушение уникальности (P2002)
      if (exception.code === 'P2002') {
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: 409,
          message: 'Запись с такими данными уже существует',
        });
      }
    }

    // Всё остальное — 500
    console.error(exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Внутренняя ошибка сервера',
    });
  }
}
```

Зарегистрировать в `main.ts`:

```ts
import { GlobalExceptionFilter } from './common/filters/prisma-exception.filter';
app.useGlobalFilters(new GlobalExceptionFilter());
```

---

## Шаг 8 — Добавить OpenAPI-декораторы на DTO

```ts
export class CreateSessionDto {
  @ApiProperty({ example: 1, description: 'ID фильма' })
  @IsInt()
  filmId: number;

  @ApiProperty({ example: 1, description: 'ID зала' })
  @IsInt()
  hallId: number;

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-03-15T11:00:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: 350 })
  @IsNumber()
  @Min(0)
  price: number;
}
```

---

## Итого — файлы которые нужно создать/изменить

### Новые файлы
- `src/common/filters/prisma-exception.filter.ts`
- `src/films/dto/create-film.dto.ts`
- `src/films/dto/update-film.dto.ts`
- `src/films/films.api.controller.ts`
- `src/sessions/dto/create-session.dto.ts`
- `src/sessions/dto/update-session.dto.ts`
- `src/sessions/sessions.api.controller.ts`
- `src/tickets/dto/create-ticket.dto.ts`
- `src/tickets/dto/update-ticket.dto.ts`
- `src/tickets/tickets.api.controller.ts`
- `src/users/dto/create-user.dto.ts`
- `src/users/dto/update-user.dto.ts`
- `src/users/users.api.controller.ts`
- `src/reviews/dto/create-review.dto.ts`
- `src/reviews/dto/update-review.dto.ts`
- `src/reviews/reviews.api.controller.ts`

### Изменяемые файлы
- `src/main.ts` — Swagger + ValidationPipe + GlobalExceptionFilter
- `src/films/films.module.ts` — добавить `FilmsApiController` в `controllers`
- `src/sessions/sessions.module.ts` — добавить `SessionsApiController`
- `src/tickets/tickets.module.ts` — добавить `TicketsApiController`
- `src/users/users.module.ts` — добавить `UsersApiController`
- `src/reviews/reviews.module.ts` — добавить `ReviewsApiController`
- `src/films/films.service.ts` — `NotFoundException` + `findAllPaginated`
- `src/sessions/sessions.service.ts` — `NotFoundException` + `findAllPaginated`
- `src/tickets/tickets.service.ts` — аналогично
- `src/users/users.service.ts` — аналогично
- `src/reviews/reviews.service.ts` — аналогично
