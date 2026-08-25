# Лабораторная работа 5 — GraphQL

## Цель
Добавить GraphQL API поверх существующего приложения: запросы, мутации, резолверы, вложенные сущности, пагинация, ограничение сложности запросов.

---

## Шаг 1 — Установить пакеты

```bash
npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
```

| Пакет | Зачем |
|---|---|
| `@nestjs/graphql` | Интеграция GraphQL в NestJS (декораторы, модуль) |
| `@nestjs/apollo` | Адаптер Apollo Server для NestJS |
| `@apollo/server` | Сам Apollo Server — выполняет запросы, отдаёт песочницу |
| `graphql` | Базовая библиотека GraphQL для JS |

---

## Шаг 2 — Подключить GraphQLModule в `app.module.ts`

```ts
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // генерирует схему автоматически
      sortSchema: true,      // сортировать типы в схеме по алфавиту
      playground: false,     // отключаем старый playground
      introspection: true,   // нужно для песочницы
    }),
    // остальные модули...
  ],
})
export class AppModule {}
```

После запуска по адресу `http://localhost:3000/graphql` будет доступна песочница Apollo Sandbox.

---

## Шаг 3 — Создать Object Types (схема данных)

Object Types — это аналоги DTO, но для GraphQL. Описывают структуру возвращаемых данных.

Создать файл `*.type.ts` в каждом модуле.

### Структура файлов

```
src/
  films/entities/film.type.ts
  sessions/entities/session.type.ts
  tickets/entities/ticket.type.ts
  users/entities/user.type.ts
  reviews/entities/review.type.ts
  films/entities/paginated-films.type.ts     ← для пагинации
  sessions/entities/paginated-sessions.type.ts
```

### Пример — `film.type.ts`

```ts
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class FilmType {
  @Field(() => Int, { description: 'ID фильма' })
  id: number;

  @Field({ description: 'Название фильма' })
  title: string;

  @Field({ description: 'Описание' })
  description: string;

  @Field(() => Int, { description: 'Длительность в минутах' })
  duration: number;

  @Field({ description: 'Жанр' })
  genre: string;

  @Field({ description: 'URL постера' })
  posterUrl: string;

  @Field(() => Int, { description: 'Год выхода' })
  releaseYear: number;

  @Field(() => Float, { nullable: true, description: 'Рейтинг 1.0–5.0' })
  rating?: number;

  @Field({ description: 'Дата создания' })
  createdAt: Date;

  // Вложенные поля — заполняются через @ResolveField в резолвере
  @Field(() => [SessionType], { nullable: true, description: 'Сеансы фильма' })
  sessions?: SessionType[];

  @Field(() => [ReviewType], { nullable: true, description: 'Отзывы о фильме' })
  reviews?: ReviewType[];
}
```

### Пример — тип для пагинации `paginated-films.type.ts`

```ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { FilmType } from './film.type';

@ObjectType()
export class PaginatedFilms {
  @Field(() => [FilmType], { description: 'Список фильмов' })
  data: FilmType[];

  @Field(() => Int, { description: 'Всего записей' })
  total: number;

  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Записей на странице' })
  limit: number;

  @Field(() => Int, { description: 'Всего страниц' })
  totalPages: number;
}
```

---

## Шаг 4 — Создать Input Types (входные данные мутаций)

Input Types — аналоги DTO для мутаций (создание/обновление).

```ts
import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsString, IsInt, Min } from 'class-validator';

@InputType()
export class CreateFilmInput {
  @Field({ description: 'Название фильма' })
  @IsString()
  title: string;

  @Field(() => Int, { description: 'Длительность в минутах' })
  @IsInt()
  @Min(1)
  duration: number;

  // ... остальные поля
}

@InputType()
export class UpdateFilmInput {
  @Field({ nullable: true })
  title?: string;

  @Field(() => Int, { nullable: true })
  duration?: number;
  // все поля nullable — это PATCH-семантика для GraphQL
}
```

---

## Шаг 5 — Создать резолверы

Резолвер — аналог контроллера для GraphQL. Обрабатывает запросы (Query) и мутации (Mutation).

```bash
nest generate resolver films --no-spec
nest generate resolver sessions --no-spec
nest generate resolver tickets --no-spec
nest generate resolver users --no-spec
nest generate resolver reviews --no-spec
```

### Пример — `films.resolver.ts`

```ts
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { FilmsService } from './films.service';
import { FilmType } from './entities/film.type';
import { PaginatedFilms } from './entities/paginated-films.type';
import { CreateFilmInput } from './dto/create-film.input';
import { UpdateFilmInput } from './dto/update-film.input';

@Resolver(() => FilmType)
export class FilmsResolver {
  constructor(
    private readonly filmsService: FilmsService,
    private readonly sessionsService: SessionsService, // для @ResolveField
  ) {}

  // ===== ЗАПРОСЫ (Query) =====

  @Query(() => PaginatedFilms, { name: 'films', description: 'Список фильмов с пагинацией' })
  findAll(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    return this.filmsService.findAllPaginated(page, limit);
  }

  @Query(() => FilmType, { name: 'film', nullable: true, description: 'Фильм по ID' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.filmsService.findOneOrFail(id);
  }

  // ===== МУТАЦИИ (Mutation) =====

  @Mutation(() => FilmType, { description: 'Создать фильм' })
  createFilm(@Args('input') input: CreateFilmInput) {
    return this.filmsService.create(input);
  }

  @Mutation(() => FilmType, { description: 'Обновить фильм' })
  updateFilm(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateFilmInput,
  ) {
    return this.filmsService.update(id, input);
  }

  @Mutation(() => FilmType, { description: 'Удалить фильм' })
  removeFilm(@Args('id', { type: () => Int }) id: number) {
    return this.filmsService.remove(id);
  }

  // ===== ВЛОЖЕННЫЕ ПОЛЯ (ResolveField) =====

  @ResolveField('sessions', () => [SessionType], { description: 'Сеансы фильма' })
  getSessions(@Parent() film: FilmType) {
    return this.sessionsService.findByFilm(film.id);
  }
}
```

---

## Шаг 6 — Зарегистрировать резолверы в модулях

В каждом `*.module.ts` добавить резолвер в `providers`:

```ts
@Module({
  providers: [FilmsService, FilmsResolver], // добавить FilmsResolver
  controllers: [...],
})
export class FilmsModule {}
```

---

## Шаг 7 — Добавить ограничение сложности запросов

Без ограничения клиент может написать вложенный запрос `films → sessions → tickets → user → reviews → ...` и положить сервер. Нужно добавить подсчёт сложности и максимальный порог.

В `app.module.ts`:

```ts
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { NoUnusedFragmentsRule } from 'graphql';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  introspection: true,
  plugins: [
    {
      requestDidStart: () => ({
        didResolveOperation({ request, document }) {
          // Простой подсчёт: каждое поле стоит 1, вложенность умножает
          // Используем встроенную валидацию через validationRules
        },
      }),
    },
  ],
  validationRules: [
    // Ограничение максимальной глубины запроса
    depthLimitRule(5), // максимум 5 уровней вложенности
  ],
}),
```

Или через пакет `graphql-depth-limit`:
```bash
npm install graphql-depth-limit
npm install --save-dev @types/graphql-depth-limit
```

```ts
import depthLimit from 'graphql-depth-limit';

GraphQLModule.forRoot<ApolloDriverConfig>({
  validationRules: [depthLimit(5)],
  // ...
})
```

---

## Шаг 8 — Проверить в песочнице

Открыть `http://localhost:3000/graphql`

### Примеры запросов для проверки

**Получить список фильмов:**
```graphql
query {
  films(page: 1, limit: 5) {
    data {
      id
      title
      genre
      rating
    }
    total
    totalPages
  }
}
```

**Получить фильм с вложенными сеансами:**
```graphql
query {
  film(id: 1) {
    id
    title
    sessions {
      id
      startTime
      price
    }
  }
}
```

**Создать фильм:**
```graphql
mutation {
  createFilm(input: {
    title: "Брат 3"
    description: "Продолжение"
    duration: 110
    genre: "Драма"
    posterUrl: "https://example.com/poster.jpg"
    releaseYear: 2026
  }) {
    id
    title
  }
}
```

**Удалить фильм:**
```graphql
mutation {
  removeFilm(id: 5) {
    id
    title
  }
}
```

---

## Итого — что нужно создать/изменить

### Новые файлы

```
src/
  films/
    entities/
      film.type.ts               ← ObjectType
      paginated-films.type.ts    ← тип пагинации
    dto/
      create-film.input.ts       ← InputType для создания
      update-film.input.ts       ← InputType для обновления
    films.resolver.ts            ← резолвер (запросы + мутации)

  sessions/
    entities/session.type.ts
    entities/paginated-sessions.type.ts
    dto/create-session.input.ts
    dto/update-session.input.ts
    sessions.resolver.ts

  tickets/
    entities/ticket.type.ts
    entities/paginated-tickets.type.ts
    dto/create-ticket.input.ts
    dto/update-ticket.input.ts
    tickets.resolver.ts

  users/
    entities/user.type.ts
    entities/paginated-users.type.ts
    dto/create-user.input.ts
    dto/update-user.input.ts
    users.resolver.ts

  reviews/
    entities/review.type.ts
    entities/paginated-reviews.type.ts
    dto/create-review.input.ts
    dto/update-review.input.ts
    reviews.resolver.ts
```

### Изменяемые файлы

- `src/app.module.ts` — добавить `GraphQLModule.forRoot`
- `src/films/films.module.ts` — добавить `FilmsResolver` в `providers`
- `src/sessions/sessions.module.ts` — добавить `SessionsResolver`
- `src/tickets/tickets.module.ts` — добавить `TicketsResolver`
- `src/users/users.module.ts` — добавить `UsersResolver`
- `src/reviews/reviews.module.ts` — добавить `ReviewsResolver`

Сервисы **не меняются** — вся бизнес-логика уже есть (`findAllPaginated`, `findOneOrFail` и т.д.).

---

## Важные нюансы

### Code-first vs Schema-first

**Schema-first** — сначала пишется `.graphql`-файл со схемой, потом код.
**Code-first** — сначала пишется код с декораторами, схема генерируется автоматически.

В лабе используется **code-first**: `autoSchemaFile` указывает куда сохранить сгенерированный `.gql`-файл.

### @ObjectType vs @InputType

- `@ObjectType` — то что **возвращает** сервер (для Query и Mutation в качестве ответа)
- `@InputType` — то что **принимает** сервер (аргументы мутаций)
- Нельзя использовать один класс для обоих — они разные типы в GraphQL

### @Query vs @Mutation

- `@Query` — получение данных, не меняет состояние (аналог GET)
- `@Mutation` — изменение данных (аналог POST/PATCH/DELETE)

### @ResolveField

Нужен когда поле объекта требует отдельного запроса к БД. Вместо того чтобы всегда подгружать связанные данные, GraphQL запросит их только если клиент явно попросил это поле. Это N+1 проблема — решается через DataLoader (опционально, для продвинутого уровня).

### Мутации должны быть семантическими

❌ Не делать: `updateTicketStatus(id, status: "PAID")`
✅ Делать: `payTicket(id)`, `cancelTicket(id)`, `reserveTicket(id)`

Каждая мутация = одно бизнес-действие с понятным названием.
