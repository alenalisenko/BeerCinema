# 📊 Инструкция по созданию ER-диаграммы

## Способ 1: Через dbdiagram.io (Рекомендуется)

1. Зайди на https://dbdiagram.io/
2. Зарегистрируйся через GitHub (бесплатно)
3. Создай новую диаграмму
4. Скопируй код ниже в редактор:

```dbdiagram
Table User {
  id integer [pk, increment]
  email varchar [unique, not null]
  name varchar [not null]
  password varchar [not null]
  role varchar [not null, default: 'CLIENT']
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null]
}

Table Film {
  id integer [pk, increment]
  title varchar [not null]
  description text [not null]
  duration integer [not null]
  genre varchar [not null]
  posterUrl varchar [not null]
  releaseYear integer [not null]
  rating float
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null]
}

Table Hall {
  id integer [pk, increment]
  name varchar [unique, not null]
  capacity integer [not null]
  description varchar
  createdAt timestamp [not null, default: `now()`]
}

Table Session {
  id integer [pk, increment]
  filmId integer [not null, ref: > Film.id]
  hallId integer [not null, ref: > Hall.id]
  startTime timestamp [not null]
  endTime timestamp [not null]
  price float [not null]
  createdAt timestamp [not null, default: `now()`]
}

Table Ticket {
  id integer [pk, increment]
  sessionId integer [not null, ref: > Session.id]
  userId integer [not null, ref: > User.id]
  seat varchar [not null]
  status varchar [not null, default: 'RESERVED']
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null]
  
  indexes {
    (sessionId, seat) [unique]
  }
}

Table Review {
  id integer [pk, increment]
  filmId integer [not null, ref: > Film.id]
  userId integer [not null, ref: > User.id]
  rating integer [not null]
  comment text [not null]
  createdAt timestamp [not null, default: `now()`]
  updatedAt timestamp [not null]
}
```

5. Диаграмма сгенерируется автоматически!
6. Экспорт → PNG
7. Сохрани как `docs/er-diagram.png`

## Способ 2: Через Prisma ERD Generator

```bash
npm install -D prisma-erd-generator @mermaid-js/mermaid-cli

# Добавь в prisma/schema.prisma:
generator erd {
  provider = "prisma-erd-generator"
  output = "../docs/er-diagram.png"
}

# Генерация:
npx prisma generate
```

## Способ 3: Через Cursor IDE PostgreSQL расширение

1. Открой PostgreSQL расширение в Cursor
2. Подключись к БД
3. В панели Tables → правый клик → Export Schema
4. Сохрани как `docs/er-diagram.png`

## Способ 4: Вручную через Draw.io

1. Зайди на https://app.diagrams.net/
2. Создай новую диаграмму
3. Используй Entity Relationship shapes
4. Нарисуй 6 таблиц со связями
5. Export → PNG
6. Сохрани как `docs/er-diagram.png`

## ✅ После создания диаграммы:

1. Убедись что файл называется `er-diagram.png`
2. Файл должен быть в папке `docs/`
3. Проверь что диаграмма показывается в README.md

```bash
# Проверка:
ls -lh docs/er-diagram.png
```
