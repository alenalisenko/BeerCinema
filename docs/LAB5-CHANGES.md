# Лаба 5 — GraphQL API

## Что было сделано

Добавлен GraphQL API поверх уже существующего REST API. Оба API работают одновременно:
- REST: `http://localhost:3000/api/films`
- GraphQL: `http://localhost:3000/graphql`

---

## Язык GraphQL — как писать запросы

### Что такое GraphQL

GraphQL — это язык запросов к API. В отличие от REST, где каждый эндпоинт возвращает фиксированный набор полей, в GraphQL **ты сам указываешь, какие поля хочешь получить**.

REST проблема:
```
GET /api/films  →  возвращает ВСЕ поля всех фильмов, даже если нужен только title
GET /api/films/1  →  нужно делать отдельный запрос чтобы получить сеансы фильма
```

GraphQL решение:
```graphql
query {
  film(id: 1) {
    title          # только нужные поля
    sessions {     # вложенные данные в одном запросе
      startTime
      price
    }
  }
}
```

### Три типа операций

| Тип | Аналог в REST | Назначение |
|-----|--------------|------------|
| `query` | GET | Чтение данных |
| `mutation` | POST/PUT/DELETE | Изменение данных |
| `subscription` | WebSocket/SSE | Подписка на события (в этом проекте не реализована) |

---

### Query — чтение данных

Базовый синтаксис:
```graphql
query {
  films {          # имя запроса (определено в резолвере)
    data {         # поле объекта
      id
      title
    }
    total
  }
}
```

Слово `query` можно опустить, если только одна операция:
```graphql
{
  films {
    data { id title }
  }
}
```

**Аргументы** — передаются в скобках:
```graphql
query {
  films(page: 2, limit: 10) {   # аргументы с именами
    data { id title }
    total
    totalPages
  }
}

query {
  film(id: 5) {   # аргумент id
    id
    title
    rating
  }
}
```

**Вложенные поля** — можно запрашивать связанные данные:
```graphql
query {
  film(id: 1) {
    id
    title
    sessions {          # вложенный объект (резолвит ResolveField)
      id
      startTime
      price
      hall {            # ещё один уровень вложенности
        name
        capacity
      }
    }
    reviews {
      rating
      comment
      user {
        name
      }
    }
  }
}
```

**Именованные запросы** — полезно при отладке:
```graphql
query GetFilmWithSessions {   # имя операции — необязательно, но удобно
  film(id: 1) {
    title
    sessions { startTime }
  }
}
```

**Переменные** — чтобы не хардкодить значения прямо в запрос:
```graphql
query GetFilm($filmId: Int!) {   # объявление переменной с типом
  film(id: $filmId) {            # использование переменной
    id
    title
  }
}
```
Переменные передаются отдельно (в панели Variables в GraphQL Playground):
```json
{ "filmId": 1 }
```

**Алиасы** — переименовать поле в ответе:
```graphql
query {
  firstFilm: film(id: 1) {    # в ответе будет "firstFilm", не "film"
    title
  }
  secondFilm: film(id: 2) {   # можно запросить одно поле дважды с разными аргументами
    title
  }
}
```

**Фрагменты** — переиспользуемые наборы полей:
```graphql
fragment FilmFields on FilmType {
  id
  title
  genre
  rating
}

query {
  film(id: 1) {
    ...FilmFields     # вставить все поля из фрагмента
    sessions { id }
  }
}
```

---

### Mutation — изменение данных

```graphql
mutation {
  createFilm(input: {        # input — объект с данными
    title: "Inception"
    description: "A thief..."
    duration: 148
    genre: "Sci-Fi"
    posterUrl: "https://..."
    releaseYear: 2010
    rating: 4.8
  }) {
    id       # поля, которые хочешь получить в ответе
    title
    createdAt
  }
}
```

Мутация с переменными:
```graphql
mutation CreateFilm($input: CreateFilmInput!) {
  createFilm(input: $input) {
    id
    title
  }
}
```
```json
{
  "input": {
    "title": "Inception",
    "description": "A thief...",
    "duration": 148,
    "genre": "Sci-Fi",
    "posterUrl": "https://...",
    "releaseYear": 2010
  }
}
```

Обновление:
```graphql
mutation {
  updateFilm(id: 1, input: { rating: 4.9 }) {
    id
    title
    rating
  }
}
```

Удаление:
```graphql
mutation {
  removeFilm(id: 1) {
    id
    title
  }
}
```

---

### Типы данных в GraphQL

| GraphQL тип | TypeScript аналог | Пример |
|-------------|-------------------|--------|
| `String` | `string` | `"Hello"` |
| `Int` | `number` (целое) | `42` |
| `Float` | `number` (дробное) | `4.5` |
| `Boolean` | `boolean` | `true` |
| `ID` | `string \| number` | `"1"` |
| `[FilmType]` | `FilmType[]` | массив |
| `FilmType!` | ненулевое | не может быть null |

---

## Новый код — объяснение

### Шаг 1. Подключение GraphQLModule

**Файл:** [src/app.module.ts](src/app.module.ts)

```typescript
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import depthLimit from 'graphql-depth-limit';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  introspection: true,
  validationRules: [depthLimit(5)],
}),
```

- `driver: ApolloDriver` — используем Apollo Server как GraphQL-движок
- `autoSchemaFile` — NestJS **автоматически генерирует** файл `schema.gql` из декораторов TypeScript. Это называется **code-first подход** — схема выводится из кода, а не пишется вручную
- `sortSchema: true` — поля в схеме сортируются по алфавиту
- `introspection: true` — позволяет инструментам (Playground, Postman) читать схему
- `validationRules: [depthLimit(5)]` — ограничение глубины запросов (защита от DDoS через глубокую вложенность)

---

### Шаг 2. ObjectType — описание формы ответа

**Файл:** [src/films/entities/film.type.ts](src/films/entities/film.type.ts)

```typescript
import { ObjectType, Field, Int, Float, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()                        // говорит GraphQL: это тип объекта в схеме
export class FilmType {
  @Field(() => Int)                  // поле типа Int (целое число)
  id: number;

  @Field()                           // String выводится автоматически из TypeScript типа
  title: string;

  @Field(() => Float, { nullable: true })  // Float + поле может быть null
  rating?: number;

  @Field(() => GraphQLISODateTime)   // специальный скаляр для дат (ISO 8601 строка)
  createdAt: Date;
}
```

**Почему отдельный файл, а не Prisma-модель?**
Prisma-модель — это описание таблицы в БД. GraphQL-тип — это описание того, что отдаётся клиенту. Это разные вещи: например, пароль пользователя есть в БД, но GraphQL-тип его не включает.

**Почему нет полей `sessions` и `reviews` в `FilmType`?**
Чтобы избежать циклических зависимостей. `FilmType` → `SessionType` → `FilmType` создаст ошибку импорта. Вместо этого связанные данные добавляются через `@ResolveField` в резолвере.

---

### Шаг 3. Paginated ObjectType — пагинация

**Файл:** [src/films/entities/paginated-films.type.ts](src/films/entities/paginated-films.type.ts)

```typescript
@ObjectType()
export class PaginatedFilms {
  @Field(() => [FilmType])   // массив объектов FilmType
  data: FilmType[];

  @Field(() => Int)
  total: number;             // всего записей в БД

  @Field(() => Int)
  page: number;              // текущая страница

  @Field(() => Int)
  limit: number;             // записей на странице

  @Field(() => Int)
  totalPages: number;        // всего страниц = Math.ceil(total / limit)
}
```

---

### Шаг 4. registerEnumType — перечисления

**Файл:** [src/tickets/entities/ticket.type.ts](src/tickets/entities/ticket.type.ts)

```typescript
import { registerEnumType } from '@nestjs/graphql';
import { TicketStatus } from '@prisma/client';  // enum из Prisma

registerEnumType(TicketStatus, {
  name: 'TicketStatus',           // имя в GraphQL схеме
  description: 'Статус билета',
  valuesMap: {
    RESERVED: { description: 'Забронирован' },
    PAID:     { description: 'Оплачен' },
    CANCELLED: { description: 'Отменён' },
  },
});
```

Без `registerEnumType` GraphQL не знает о enum из Prisma. Эта функция регистрирует его в схеме, чтобы можно было писать:
```graphql
query {
  tickets {
    data { status }   # вернёт "RESERVED", "PAID" или "CANCELLED"
  }
}
```

---

### Шаг 5. InputType — данные для мутаций

**Файл:** [src/films/dto/create-film.input.ts](src/films/dto/create-film.input.ts)

```typescript
import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

@InputType()                          // говорит GraphQL: это входной тип (для аргументов мутаций)
export class CreateFilmInput {
  @Field()
  @IsString()                         // валидация через class-validator
  title: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(1) @Max(5)
  rating?: number;
}
```

`@ObjectType` — тип для **ответов** (что возвращаем)
`@InputType` — тип для **аргументов** (что принимаем)

Их нельзя смешивать — GraphQL это разные категории в схеме.

**Файл:** [src/films/dto/update-film.input.ts](src/films/dto/update-film.input.ts)

```typescript
import { InputType, PartialType } from '@nestjs/graphql';
import { CreateFilmInput } from './create-film.input';

@InputType()
export class UpdateFilmInput extends PartialType(CreateFilmInput) {}
```

`PartialType` из `@nestjs/graphql` делает все поля необязательными (`nullable: true`). Не путать с `PartialType` из `@nestjs/swagger` — они разные, нужен правильный импорт.

---

### Шаг 6. Resolver — обработчик GraphQL запросов

**Файл:** [src/films/films.resolver.ts](src/films/films.resolver.ts)

Resolver — аналог Controller в REST. Каждый метод резолвера обрабатывает один query или mutation.

```typescript
@Resolver(() => FilmType)     // этот резолвер обслуживает тип FilmType
export class FilmsResolver {
  constructor(
    private readonly filmsService: FilmsService,
    private readonly prisma: PrismaService,   // напрямую для ResolveField
  ) {}
```

#### @Query — обработчик запроса

```typescript
@Query(() => PaginatedFilms, {
  name: 'films',                    // имя в GraphQL схеме (films { ... })
  description: 'Список фильмов',
})
findAll(
  @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
  @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
) {
  return this.filmsService.findAllPaginated(page, limit);
}
```

- `@Query(() => FilmType)` — аналог `@Get()` в REST
- `name: 'films'` — по умолчанию имя берётся из имени метода (`findAll`), `name` переопределяет его
- `@Args('page', ...)` — аналог `@Query('page')` в REST
- `type: () => Int` — нужно явно указывать тип, потому что TypeScript `number` это и `Int`, и `Float`
- `defaultValue: 1` — если аргумент не передан, используется это значение

```typescript
@Query(() => FilmType, { name: 'film', nullable: true })
findOne(@Args('id', { type: () => Int }) id: number) {
  return this.filmsService.findOneOrFail(id);
}
```

`nullable: true` — запрос может вернуть `null` (если фильм не найден)

#### @Mutation — обработчик мутации

```typescript
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
```

- `@Mutation(() => FilmType)` — аналог `@Post()` / `@Put()` в REST
- `@Args('input')` — GraphQL знает тип из TypeScript аннотации `input: CreateFilmInput`, поэтому `type` не нужен

#### @ResolveField — вложенные поля

```typescript
@ResolveField('sessions', () => [SessionType], { description: 'Сеансы фильма' })
getSessions(@Parent() film: FilmType) {
  return this.prisma.session.findMany({
    where: { filmId: film.id },
    orderBy: { startTime: 'asc' },
  });
}
```

`@ResolveField` — вызывается **только тогда, когда клиент запросил это поле**.

Если клиент пишет:
```graphql
query {
  film(id: 1) { title }   # sessions НЕ запрошены
}
```
→ `getSessions()` **не вызовется**, запрос в БД не произойдёт.

Если клиент пишет:
```graphql
query {
  film(id: 1) {
    title
    sessions { id }   # sessions запрошены
  }
}
```
→ сначала вызовется `findOne(1)`, потом `getSessions(film)`.

`@Parent()` — инжектирует родительский объект (результат `findOne`), чтобы достать `film.id`.

**Почему `prisma` напрямую, а не через `SessionsService`?**
Потому что `SessionsService` находится в другом модуле. Импортировать `SessionsModule` в `FilmsModule` создало бы циклическую зависимость (Films → Sessions → Films). `PrismaService` помечен как `@Global()`, поэтому доступен везде без дополнительных импортов.

---

### Шаг 7. Семантические мутации для билетов

**Файл:** [src/tickets/tickets.resolver.ts](src/tickets/tickets.resolver.ts)

Вместо одной мутации `updateTicketStatus(id, status)` — три отдельных:

```typescript
@Mutation(() => TicketType, { description: 'Оплатить билет' })
payTicket(@Args('id', { type: () => Int }) id: number) {
  return this.ticketsService.updateStatus(id, 'PAID');
}

@Mutation(() => TicketType, { description: 'Отменить билет' })
cancelTicket(@Args('id', { type: () => Int }) id: number) {
  return this.ticketsService.updateStatus(id, 'CANCELLED');
}

@Mutation(() => TicketType, { description: 'Вернуть в статус Забронирован' })
reserveTicket(@Args('id', { type: () => Int }) id: number) {
  return this.ticketsService.updateStatus(id, 'RESERVED');
}
```

Это называется **семантические мутации** — мутация выражает бизнес-действие (`payTicket`), а не техническую операцию (`updateStatus`). GraphQL API становится понятнее для клиента.

---

### Шаг 8. Регистрация резолверов в модулях

**Файл:** [src/films/films.module.ts](src/films/films.module.ts)

```typescript
@Module({
  providers: [FilmsService, FilmsResolver],   // добавили FilmsResolver
  controllers: [FilmsController, FilmsApiController],
  exports: [FilmsService],
})
```

Резолвер — это провайдер (`@Injectable()`), поэтому добавляется в `providers`, как и сервис.

---

### Шаг 9. Depth Limit — защита от сложных запросов

```typescript
import depthLimit from 'graphql-depth-limit';

GraphQLModule.forRoot<ApolloDriverConfig>({
  validationRules: [depthLimit(5)],  // максимальная глубина вложенности = 5
})
```

Без этого клиент мог бы написать:
```graphql
query {
  film(id: 1) {
    sessions {
      tickets {
        user {
          reviews {
            film {
              sessions {
                tickets { ... }  # бесконечно глубоко
              }
            }
          }
        }
      }
    }
  }
}
```
Это создаёт экспоненциальную нагрузку на БД. Depth limit отклоняет запрос **до его выполнения**.

---

## Как связаны все части

```
GraphQL запрос от клиента
         │
         ▼
    Apollo Server
    (GraphQLModule)
         │
         ▼ valida на depth limit
         │
         ▼
    Resolver (films.resolver.ts)
    ├── @Query → FilmsService.findAllPaginated()
    ├── @Mutation → FilmsService.create()
    └── @ResolveField → PrismaService.session.findMany()
         │
         ▼
    Service (films.service.ts)
         │
         ▼
    PrismaService → PostgreSQL
         │
         ▼
    Ответ обратно клиенту (только запрошенные поля)
```

---

## Code-first vs Schema-first

NestJS поддерживает два подхода:

**Schema-first** — сначала пишешь схему вручную (`.graphql` файл), потом генерируешь TypeScript типы:
```graphql
# schema.graphql
type Film {
  id: Int!
  title: String!
}

type Query {
  film(id: Int!): Film
}
```

**Code-first** (наш подход) — пишешь TypeScript декораторы, схема генерируется автоматически:
```typescript
@ObjectType()
class FilmType {
  @Field(() => Int) id: number;
  @Field() title: string;
}
```
→ NestJS автоматически создаёт `schema.gql` при запуске сервера.

Преимущество code-first: одна кодовая база, нет рассинхронизации между схемой и кодом.

---

## Итоговая структура новых файлов

```
src/
├── app.module.ts               ← добавлен GraphQLModule + depthLimit
├── films/
│   ├── dto/
│   │   ├── create-film.input.ts    ← @InputType для создания
│   │   └── update-film.input.ts    ← PartialType(CreateFilmInput)
│   ├── entities/
│   │   ├── film.type.ts            ← @ObjectType
│   │   └── paginated-films.type.ts ← @ObjectType обёртка пагинации
│   └── films.resolver.ts           ← @Resolver с Query/Mutation/ResolveField
├── sessions/ (аналогично)
├── tickets/  (аналогично + семантические мутации)
├── users/    (аналогично)
└── reviews/  (аналогично)
```
