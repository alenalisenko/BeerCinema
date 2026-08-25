# Лабораторная работа 4 — документация по коду

## Что было сделано

Добавлено REST API поверх уже существующего MVC-приложения. MVC-контроллеры (лаба 3) не изменялись — рядом с каждым был создан отдельный API-контроллер.

### Установленные пакеты

```bash
npm install @nestjs/swagger class-validator class-transformer
```

| Пакет | Зачем |
|---|---|
| `@nestjs/swagger` | Генерация OpenAPI-документации и UI Swagger |
| `class-validator` | Декораторы валидации DTO (`@IsString`, `@IsInt` и др.) |
| `class-transformer` | Преобразование типов из строки в нужный тип (нужен для `ValidationPipe`) |

---

## 1. `src/main.ts` — добавлена глобальная инфраструктура

### Что добавилось

```ts
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

// Глобальная валидация DTO
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

// Глобальный обработчик ошибок
app.useGlobalFilters(new GlobalExceptionFilter());

// Swagger
const config = new DocumentBuilder()
  .setTitle('BeerCinema API')
  .setDescription('REST API для системы управления кинотеатром')
  .setVersion('1.0')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Строка за строкой

**`app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`**

`ValidationPipe` — встроенный в NestJS механизм валидации. Он перехватывает входящие данные запроса (`@Body`) и проверяет их по правилам, описанным в DTO-классах через декораторы `class-validator`.

- `whitelist: true` — автоматически удаляет из тела запроса все поля, которых нет в DTO. Например, если клиент прислал `{ title: "...", hackField: "..." }`, то `hackField` будет молча отброшен.
- `transform: true` — автоматически преобразует типы. Строка `"42"` из URL-параметра превратится в число `42`, что нужно для декораторов `@IsInt`.

Без этого pipe декораторы на DTO-классах (`@IsString`, `@IsInt` и т.д.) вообще не работают — они только описывают правила, а ValidationPipe их применяет.

**`app.useGlobalFilters(new GlobalExceptionFilter())`**

Регистрирует фильтр исключений глобально — он будет перехватывать любые необработанные ошибки во всём приложении и возвращать правильный JSON-ответ. Подробнее о самом фильтре — ниже.

**`DocumentBuilder`** — построитель конфигурации Swagger. Здесь задаётся название, описание и версия API.

**`SwaggerModule.createDocument(app, config)`** — анализирует все контроллеры приложения, собирает информацию о маршрутах, параметрах, телах запросов (из DTO), и формирует объект в формате OpenAPI 3.0.

**`SwaggerModule.setup('api/docs', app, document)`** — регистрирует два маршрута: `GET /api/docs` (Swagger UI) и `GET /api/docs-json` (сырой JSON спецификации).

---

## 2. `src/common/filters/global-exception.filter.ts` — новый файл

```ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: 404,
          message: 'Запись не найдена',
        });
      }
      if (exception.code === 'P2002') {
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: 409,
          message: 'Запись с такими данными уже существует',
        });
      }
    }

    console.error(exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Внутренняя ошибка сервера',
    });
  }
}
```

### Зачем это нужно

Без фильтра, если Prisma не нашла запись (например, `findUnique` вернул `null` и мы бросили `NotFoundException`) — NestJS сам обрабатывает это и возвращает JSON. Но если Prisma сама бросает ошибку (`PrismaClientKnownRequestError`) — например, при удалении несуществующей записи — NestJS не знает что с этим делать и вернёт HTML-страницу с ошибкой 500.

Фильтр нужен чтобы **одинаково обрабатывать все ошибки** независимо от их источника.

### Строка за строкой

**`@Catch()`** — декоратор без аргументов означает «ловить все исключения». Можно написать `@Catch(HttpException)` чтобы ловить только конкретный тип.

**`implements ExceptionFilter`** — интерфейс NestJS, требует реализации метода `catch(exception, host)`.

**`host.switchToHttp()`** — фильтры работают не только для HTTP, но и для WebSocket, gRPC. Этой строкой говорим «нас интересует HTTP-контекст».

**`ctx.getResponse<Response>()`** — получаем объект Express-ответа, чтобы вручную вызвать `response.status(...).json(...)`.

**`exception instanceof HttpException`** — проверяем, является ли ошибка HTTP-исключением NestJS (`NotFoundException`, `BadRequestException` и т.д.). Если да — просто пробрасываем как есть, NestJS сам знает нужный статус-код.

**`Prisma.PrismaClientKnownRequestError`** — класс ошибок Prisma с известным кодом. Код `P2025` = «запись не найдена при update/delete», `P2002` = «нарушение уникального ограничения» (например, попытка создать пользователя с уже существующим email).

---

## 3. DTO-классы — новые файлы

Созданы в папке `dto/` внутри каждого модуля: `create-*.dto.ts` и `update-*.dto.ts`.

### Структура

```
src/
  films/dto/     create-film.dto.ts    update-film.dto.ts
  sessions/dto/  create-session.dto.ts update-session.dto.ts
  tickets/dto/   create-ticket.dto.ts  update-ticket.dto.ts
  users/dto/     create-user.dto.ts    update-user.dto.ts
  reviews/dto/   create-review.dto.ts  update-review.dto.ts
```

### Что такое DTO

DTO (Data Transfer Object) — объект для передачи данных. Это обычный TypeScript-класс, в котором через декораторы описано: какие поля ожидаются в запросе, какого они типа, обязательные или нет, с какими ограничениями.

### Пример — `create-film.dto.ts`

```ts
import { IsString, IsInt, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFilmDto {
  @ApiProperty({ example: 'Брат 2' })
  @IsString()
  title: string;

  @ApiProperty({ example: 122, description: 'Длительность в минутах' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ example: 4.5, description: 'Рейтинг от 1.0 до 5.0' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
```

**`@ApiProperty`** — говорит Swagger: «это поле обязательное, показывай его в документации с этим примером».

**`@ApiPropertyOptional`** — то же самое, но помечает поле как необязательное (аналог `required: false` в OpenAPI).

**`@IsString()`** — ValidationPipe проверит, что поле является строкой. Если нет — вернёт 400.

**`@IsInt()`** — проверяет, что значение является целым числом.

**`@Min(1)`, `@Max(5)`** — проверяет диапазон значения.

**`@IsOptional()`** — если поле отсутствует в запросе — валидация пропускается. Без него отсутствующее поле с `@IsNumber()` вызвало бы ошибку 400.

### `update-film.dto.ts`

```ts
import { PartialType } from '@nestjs/swagger';
import { CreateFilmDto } from './create-film.dto';

export class UpdateFilmDto extends PartialType(CreateFilmDto) {}
```

`PartialType` из `@nestjs/swagger` создаёт новый класс на основе существующего, где все поля становятся необязательными (`?`). Это нужно потому что при PATCH-запросе клиент присылает только изменяемые поля. Swagger тоже автоматически узнаёт об этом и правильно отображает схему.

---

## 4. API-контроллеры — новые файлы

Для каждой сущности создан файл `*.api.controller.ts` рядом с MVC-контроллером.

### Пример — `films.api.controller.ts`

```ts
@ApiTags('films')        // группирует маршруты под тегом "films" в Swagger
@Controller('api/films') // базовый префикс — все маршруты начинаются с /api/films
export class FilmsApiController {
  constructor(private readonly filmsService: FilmsService) {}
```

**`@ApiTags('films')`** — в Swagger UI все эндпоинты этого контроллера будут сгруппированы под разделом «films». По условию лабы — один тег = один модуль.

**`@Controller('api/films')`** — базовый путь. Не `/films` (это MVC), а `/api/films`.

---

### GET /api/films — список с пагинацией

```ts
@Get()
async findAll(
  @Query('page') page = '1',
  @Query('limit') limit = '10',
  @Res({ passthrough: true }) res: Response,
) {
  const result = await this.filmsService.findAllPaginated(+page, +limit);

  const links: string[] = [];
  if (+page > 1)
    links.push(`</api/films?page=${+page - 1}&limit=${limit}>; rel="prev"`);
  if (+page < result.meta.totalPages)
    links.push(`</api/films?page=${+page + 1}&limit=${limit}>; rel="next"`);
  if (links.length) res.setHeader('Link', links.join(', '));

  return result;
}
```

**`@Query('page') page = '1'`** — читает параметр `?page=2` из URL. Если не передан — по умолчанию `'1'`.

**`+page`** — унарный плюс, переводит строку `'2'` в число `2`.

**`@Res({ passthrough: true })`** — даём NestJS доступ к объекту ответа Express, чтобы вручную добавить заголовок. `passthrough: true` важно — без него NestJS не стал бы автоматически сериализовать возвращаемое значение в JSON.

**Заголовок `Link`** — стандарт RFC 5988, часть HATEOAS. Позволяет клиенту «перемещаться» по страницам не зная URL заранее:

```
Link: </api/films?page=1&limit=10>; rel="prev", </api/films?page=3&limit=10>; rel="next"
```

---

### GET /api/films/:id

```ts
@Get(':id')
@ApiResponse({ status: 404, description: 'Фильм не найден' })
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.filmsService.findOneOrFail(id);
}
```

**`ParseIntPipe`** — встроенный pipe NestJS. Преобразует строку `"42"` из URL в число `42`. Если строка не является числом — автоматически возвращает 400 Bad Request.

**`findOneOrFail`** — метод сервиса, который бросает `NotFoundException` если запись не найдена. Это бросание перехватит `GlobalExceptionFilter` и вернёт 404 JSON.

---

### POST /api/films — создание

```ts
@Post()
@ApiResponse({ status: 400, description: 'Ошибка валидации' })
create(@Body() dto: CreateFilmDto) {
  return this.filmsService.create(dto);
}
```

**`@Body() dto: CreateFilmDto`** — NestJS автоматически десериализует тело запроса из JSON в объект `CreateFilmDto`. Затем `ValidationPipe` (зарегистрированный в `main.ts`) проверяет поля по декораторам. Если что-то не так — клиент получает 400 с описанием ошибки, до сервиса запрос не доходит.

---

### PATCH /api/films/:id — обновление

```ts
@Patch(':id')
update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFilmDto) {
  return this.filmsService.update(id, dto);
}
```

`PATCH` вместо `PUT` — потому что PATCH означает частичное обновление (только переданные поля), PUT — полную замену. `UpdateFilmDto` (через `PartialType`) делает все поля необязательными, что соответствует семантике PATCH.

---

### DELETE /api/films/:id

```ts
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
remove(@Param('id', ParseIntPipe) id: number) {
  return this.filmsService.remove(id);
}
```

**`@HttpCode(HttpStatus.NO_CONTENT)`** — возвращает статус 204 вместо дефолтного 200. По стандарту REST, успешное удаление возвращает 204 (No Content) — тело ответа пустое.

---

## 5. Обновления сервисов

В каждый сервис добавлены три типа методов.

### `findOneOrFail`

```ts
async findOneOrFail(id: number) {
  const film = await this.findOne(id);
  if (!film) throw new NotFoundException(`Фильм #${id} не найден`);
  return film;
}
```

Раньше `findOne` возвращал `null` если запись не найдена. API-контроллер должен возвращать 404, MVC-контроллер — HTML-страницу. Чтобы не дублировать эту проверку в каждом контроллере, она вынесена в сервис.

`NotFoundException` — класс из `@nestjs/common`, автоматически превращается в HTTP 404. `GlobalExceptionFilter` его перехватывает и возвращает JSON.

---

### `findAllPaginated`

```ts
async findAllPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    this.prisma.film.findMany({ skip, take: limit, orderBy: { title: 'asc' } }),
    this.prisma.film.count(),
  ]);
  return {
    data: items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
```

**`skip`** — сколько записей пропустить. Страница 2 с лимитом 10: `skip = (2-1)*10 = 10`, то есть берём записи начиная с 11-й.

**`take: limit`** — сколько записей взять.

**`Promise.all([...])`** — выполняет два запроса к БД параллельно: один за данными, один за общим количеством. Это быстрее чем последовательно.

**`Math.ceil(total / limit)`** — округление вверх. 11 записей при лимите 10 = 2 страницы.

**Структура ответа:**
```json
{
  "data": [...],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### Вложенные ресурсы (findSessions, findTickets и др.)

```ts
// В FilmsService
async findSessions(filmId: number) {
  await this.findOneOrFail(filmId); // сначала проверяем что фильм существует
  return this.prisma.session.findMany({
    where: { filmId },
    include: { hall: true },
    orderBy: { startTime: 'asc' },
  });
}
```

Это нужно для маршрутов вида `GET /api/films/:id/sessions` — получить дочерние сущности из родительской. Перед запросом проверяем что родитель существует, чтобы вернуть 404 если фильм не найден, а не просто пустой массив.

---

## 6. MVC-контроллеры — добавлен `@ApiExcludeController()`

```ts
@ApiExcludeController()
@Controller('films')
export class FilmsController { ... }
```

Swagger по умолчанию включает в документацию **все** контроллеры приложения. MVC-контроллеры (`/films/add`, `/films/{id}/update` и т.д.) — это HTML-страницы, они не должны быть в REST API документации.

`@ApiExcludeController()` говорит Swagger: «не включай этот контроллер в документацию». Добавлено во все 6 MVC-контроллеров: `AppController`, `FilmsController`, `SessionsController`, `TicketsController`, `UsersController`, `ReviewsController`.

---

## Итоговая структура новых файлов

```
src/
  common/
    filters/
      global-exception.filter.ts   ← обработчик всех ошибок
  films/
    dto/
      create-film.dto.ts            ← валидация при создании
      update-film.dto.ts            ← валидация при обновлении (все поля опциональны)
    films.api.controller.ts         ← REST API контроллер
  sessions/
    dto/
      create-session.dto.ts
      update-session.dto.ts
    sessions.api.controller.ts
  tickets/
    dto/
      create-ticket.dto.ts
      update-ticket.dto.ts
    tickets.api.controller.ts
  users/
    dto/
      create-user.dto.ts
      update-user.dto.ts
    users.api.controller.ts
  reviews/
    dto/
      create-review.dto.ts
      update-review.dto.ts
    reviews.api.controller.ts
```

---

## Возможные вопросы преподавателя

### Что такое DTO и зачем он нужен?

DTO (Data Transfer Object) — объект для передачи данных между слоями. В контексте REST API — это класс, описывающий ожидаемую структуру тела запроса. Зачем: чтобы не доверять данным от клиента и явно описать что принимает API. ValidationPipe применяет декораторы DTO и возвращает 400 если данные неверны.

### Чем PATCH отличается от PUT?

`PUT` — полная замена ресурса. Клиент должен прислать все поля, иначе остальные обнулятся. `PATCH` — частичное обновление, присылаются только изменяемые поля. В лабе используется PATCH + `PartialType` в DTO, что соответствует стандарту REST.

### Зачем ValidationPipe с `whitelist: true`?

Без `whitelist` клиент мог бы прислать `{ title: "...", role: "ADMIN", ... }` и поле `role` попало бы в объект. С `whitelist: true` поля которых нет в DTO автоматически удаляются до того как данные дойдут до сервиса. Это защита от инъекции лишних данных.

### Что такое пагинация и зачем?

Если вернуть все записи из БД сразу — при большом количестве данных это: 1) медленно (долгий SQL-запрос), 2) много памяти, 3) большой ответ клиенту. Пагинация делит данные на страницы: `?page=1&limit=10` — первые 10 записей, `?page=2&limit=10` — следующие 10.

### Что такое заголовок Link и HATEOAS?

HATEOAS (Hypermedia as the Engine of Application State) — принцип REST, при котором ответ сервера содержит ссылки на связанные ресурсы. Клиент не должен «знать» URL следующей страницы — он получает его из заголовка `Link`. Это делает API самодокументируемым.

### Зачем нужен ExceptionFilter, если NestJS сам обрабатывает ошибки?

NestJS умеет обрабатывать только собственные HTTP-исключения (`HttpException` и наследники). Но Prisma бросает свои ошибки (`PrismaClientKnownRequestError`), о которых NestJS ничего не знает и вернёт HTML 500. Фильтр перехватывает всё, включая ошибки Prisma, и возвращает предсказуемый JSON с нужным статус-кодом.

### Почему использовался `import type { Response }`, а не обычный `import`?

Из-за совместного использования `isolatedModules` (компиляция без анализа зависимостей) и `emitDecoratorMetadata` (метаданные для DI). Когда тип используется в декорированной сигнатуре метода, TypeScript пытается включить его в скомпилированный JS как значение. `import type` говорит компилятору: «это только тип, не включай его в рантайм».

### Как Swagger генерирует документацию?

`SwaggerModule.createDocument` сканирует все контроллеры через reflection API TypeScript. Декораторы `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty` добавляют метаданные к классам и методам. Swagger читает эти метаданные и строит JSON в формате OpenAPI 3.0, который Swagger UI визуализирует.

### Зачем `Promise.all` в `findAllPaginated`?

Без `Promise.all`:
```ts
const items = await prisma.findMany(...); // ждём ~20ms
const total = await prisma.count();      // ждём ещё ~10ms = 30ms total
```
С `Promise.all`:
```ts
const [items, total] = await Promise.all([
  prisma.findMany(...),
  prisma.count(),       // оба запроса идут параллельно = ~20ms total
]);
```
Два независимых запроса к БД выполняются одновременно — это быстрее.
