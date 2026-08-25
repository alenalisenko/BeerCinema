# GraphQL шпаргалка — BeerCinema

Endpoint: `http://localhost:3000/graphql`

---

## QUERIES — чтение данных

### Фильмы

```graphql
# Список с пагинацией
query {
  films(page: 1, limit: 10) {
    data {
      id
      title
      genre
      rating
      releaseYear
      duration
    }
    total
    page
    limit
    totalPages
  }
}

# Один фильм
query {
  film(id: 1) {
    id
    title
    description
    genre
    rating
    releaseYear
    duration
    posterUrl
    createdAt
    updatedAt
  }
}

# Фильм + его сеансы + отзывы (вложенные данные)
query {
  film(id: 1) {
    title
    sessions {
      id
      startTime
      price
      hall { name capacity }
    }
    reviews {
      id
      rating
      comment
      user { name }
    }
  }
}
```

### Сеансы

```graphql
# Список
query {
  sessions(page: 1, limit: 10) {
    data {
      id
      startTime
      endTime
      price
    }
    total
    totalPages
  }
}

# Один сеанс + фильм + зал + билеты
query {
  session(id: 1) {
    id
    startTime
    endTime
    price
    film { id title }
    hall { id name capacity }
    tickets { id seat status }
  }
}
```

### Билеты

```graphql
# Список
query {
  tickets(page: 1, limit: 10) {
    data {
      id
      seat
      status
    }
    total
    totalPages
  }
}

# Один билет + сеанс + пользователь
query {
  ticket(id: 1) {
    id
    seat
    status
    session { startTime price }
    user { name email }
  }
}
```

### Пользователи

```graphql
# Список
query {
  users(page: 1, limit: 10) {
    data {
      id
      email
      name
      role
    }
    total
    totalPages
  }
}

# Один пользователь + его билеты + отзывы
query {
  user(id: 1) {
    id
    name
    email
    role
    tickets { id seat status }
    reviews { id rating comment }
  }
}
```

### Отзывы

```graphql
# Список
query {
  reviews(page: 1, limit: 10) {
    data {
      id
      rating
      comment
    }
    total
    totalPages
  }
}

# Один отзыв + фильм + автор
query {
  review(id: 1) {
    id
    rating
    comment
    film { title }
    user { name }
  }
}
```

---

## MUTATIONS — изменение данных

### Фильмы

```graphql
# Создать
mutation {
  createFilm(input: {
    title: "Брат 2"
    description: "Криминальная драма"
    duration: 122
    genre: "Драма"
    posterUrl: "https://example.com/poster.jpg"
    releaseYear: 2000
    rating: 4.5        # необязательно
  }) {
    id
    title
  }
}

# Обновить (все поля необязательны — передавай только нужные)
mutation {
  updateFilm(id: 1, input: {
    rating: 4.8
  }) {
    id
    title
    rating
  }
}

# Удалить
mutation {
  removeFilm(id: 1) {
    id
    title
  }
}
```

### Сеансы

```graphql
# Создать
mutation {
  createSession(input: {
    filmId: 1
    hallId: 1
    startTime: "2026-04-15T10:00:00.000Z"
    endTime: "2026-04-15T12:00:00.000Z"
    price: 350
  }) {
    id
    startTime
    price
  }
}

# Обновить цену
mutation {
  updateSession(id: 1, input: {
    price: 400
  }) {
    id
    price
  }
}

# Удалить
mutation {
  removeSession(id: 1) {
    id
  }
}
```

### Билеты

```graphql
# Создать (забронировать место)
mutation {
  createTicket(input: {
    sessionId: 1
    userId: 1
    seat: "A5"
  }) {
    id
    seat
    status
  }
}

# Оплатить билет
mutation {
  payTicket(id: 1) {
    id
    status
  }
}

# Отменить билет
mutation {
  cancelTicket(id: 1) {
    id
    status
  }
}

# Вернуть в статус "Забронирован"
mutation {
  reserveTicket(id: 1) {
    id
    status
  }
}

# Удалить
mutation {
  removeTicket(id: 1) {
    id
  }
}
```

### Пользователи

```graphql
# Создать
mutation {
  createUser(input: {
    email: "user@example.com"
    name: "Алёна"
    password: "secret123"
    role: CLIENT        # необязательно: CLIENT | ADMIN | MANAGER
  }) {
    id
    email
    role
  }
}

# Обновить
mutation {
  updateUser(id: 1, input: {
    name: "Новое имя"
  }) {
    id
    name
  }
}

# Удалить
mutation {
  removeUser(id: 1) {
    id
    email
  }
}
```

### Отзывы

```graphql
# Создать
mutation {
  createReview(input: {
    filmId: 1
    userId: 1
    rating: 5
    comment: "Отличный фильм!"
  }) {
    id
    rating
    comment
  }
}

# Обновить
mutation {
  updateReview(id: 1, input: {
    rating: 4
    comment: "Пересмотрела — уже не так нравится"
  }) {
    id
    rating
    comment
  }
}

# Удалить
mutation {
  removeReview(id: 1) {
    id
  }
}
```

---

## Полезные паттерны

### Переменные (чтобы не хардкодить значения)

```graphql
mutation CreateFilm($input: CreateFilmInput!) {
  createFilm(input: $input) {
    id
    title
  }
}
```
В панели Variables:
```json
{
  "input": {
    "title": "Inception",
    "description": "Вор проникает в сны",
    "duration": 148,
    "genre": "Sci-Fi",
    "posterUrl": "https://example.com/inception.jpg",
    "releaseYear": 2010
  }
}
```

### Фрагмент — переиспользуемый набор полей

```graphql
fragment FilmBase on FilmType {
  id
  title
  genre
  rating
}

query {
  film(id: 1) {
    ...FilmBase
    sessions { startTime }
  }
}
```

### Проверка depth limit (должна вернуть ошибку)

```graphql
query {
  film(id: 1) {
    sessions {
      tickets {
        user {
          reviews {
            film { title }
          }
        }
      }
    }
  }
}
```
Ожидаемый ответ: `"'film' exceeds maximum operation depth of 5"`

---

## Типы данных

| GraphQL тип | Пример значения |
|---|---|
| `Int!` | `1`, `42` |
| `Float` | `4.5`, `350.0` |
| `String!` | `"Привет"` |
| `Boolean` | `true`, `false` |
| `DateTime!` | `"2026-04-15T10:00:00.000Z"` |
| `Role` | `CLIENT`, `ADMIN`, `MANAGER` |
| `TicketStatus` | `RESERVED`, `PAID`, `CANCELLED` |

`!` означает обязательное поле — нельзя передать `null`.
Без `!` — поле необязательное, можно не передавать.
