import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Создаем пользователей
  const admin = await prisma.user.create({
    data: {
      email: 'admin@beercinema.ru',
      name: 'Алёна Лисенко',
      password: 'admin123',
      role: 'ADMIN',
    },
  });

  const client = await prisma.user.create({
    data: {
      email: 'client@example.com',
      name: 'Иван Иванов',
      password: 'client123',
      role: 'CLIENT',
    },
  });

  // 2. Создаем залы
  const halls = await prisma.hall.createMany({
    data: [
      { name: 'ЗОЖ', capacity: 50, description: 'Зал здорового образа жизни' },
      { name: 'Балтика', capacity: 80, description: 'Большой зал с баром' },
      { name: 'Разливное пиво', capacity: 30, description: 'Уютный зал' },
    ],
  });


  // 3. Создаем фильмы
  const film1 = await prisma.film.create({
    data: {
      title: '100 лет тому вперед',
      description: 'Советская фантастическая комедия про путешествие во времени',
      duration: 134,
      genre: 'Фантастика',
      posterUrl: '/assets/images/100years.png',
      releaseYear: 1984,
      rating: 4.5,
    },
  });

  const film2 = await prisma.film.create({
    data: {
      title: 'Брат 2',
      description: 'Продолжение культового российского боевика',
      duration: 122,
      genre: 'Боевик',
      posterUrl: '/assets/images/brat.png',
      releaseYear: 2000,
      rating: 4.8,
    },
  });

  const film3 = await prisma.film.create({
    data: {
      title: 'Головоломка 2',
      description: 'Анимационный фильм о мире эмоций',
      duration: 96,
      genre: 'Мультфильм',
      posterUrl: '/assets/images/insideout.png',
      releaseYear: 2024,
      rating: 4.7,
    },
  });

  const film4 = await prisma.film.create({
    data: {
      title: 'Леон',
      description: 'Культовый боевик Люка Бессона',
      duration: 110,
      genre: 'Боевик',
      posterUrl: '/assets/images/leon.png',
      releaseYear: 1994,
      rating: 4.9,
    },
  });

  const film5 = await prisma.film.create({
    data: {
      title: 'Серебряные коньки',
      description: 'Российская историческая драма',
      duration: 136,
      genre: 'Драма',
      posterUrl: '/assets/images/silver.png',
      releaseYear: 2020,
      rating: 4.2,
    },
  });

  const film6 = await prisma.film.create({
    data: {
      title: 'Каскадеры',
      description: 'Боевик про каскадёров',
      duration: 127,
      genre: 'Боевик',
      posterUrl: '/assets/images/kaskader.png',
      releaseYear: 2024,
      rating: 4.1,
    },
  });

  const film7 = await prisma.film.create({
    data: {
      title: '12 друзей Оушена',
      description: 'Криминальная комедия про ограбление',
      duration: 125,
      genre: 'Комедия',
      posterUrl: '/assets/images/friends.png',
      releaseYear: 2004,
      rating: 4.6,
    },
  });


  // 4. Получаем созданные залы
  const hallZOZH = await prisma.hall.findUnique({ where: { name: 'ЗОЖ' } });
  const hallBaltika = await prisma.hall.findUnique({ where: { name: 'Балтика' } });
  const hallBeer = await prisma.hall.findUnique({ where: { name: 'Разливное пиво' } });

  // 5. Создаем сеансы
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Сеанс 1: 100 лет тому вперед в ЗОЖ
  const session1 = await prisma.session.create({
    data: {
      filmId: film1.id,
      hallId: hallZOZH!.id,
      startTime: new Date(today.getTime()),
      endTime: new Date(today.getTime() + film1.duration * 60000),
      price: 350,
    },
  });

  // Сеанс 2: Брат 2 в Балтике
  const time2 = new Date(today);
  time2.setHours(12, 15, 0, 0);
  const session2 = await prisma.session.create({
    data: {
      filmId: film2.id,
      hallId: hallBaltika!.id,
      startTime: time2,
      endTime: new Date(time2.getTime() + film2.duration * 60000),
      price: 400,
    },
  });

  // Сеанс 3: 12 друзей Оушена в Разливное пиво
  const time3 = new Date(today);
  time3.setHours(12, 45, 0, 0);
  const session3 = await prisma.session.create({
    data: {
      filmId: film7.id,
      hallId: hallBeer!.id,
      startTime: time3,
      endTime: new Date(time3.getTime() + film7.duration * 60000),
      price: 300,
    },
  });

  // Сеанс 4: Головоломка 2 в ЗОЖ
  const time4 = new Date(today);
  time4.setHours(14, 5, 0, 0);
  const session4 = await prisma.session.create({
    data: {
      filmId: film3.id,
      hallId: hallZOZH!.id,
      startTime: time4,
      endTime: new Date(time4.getTime() + film3.duration * 60000),
      price: 380,
    },
  });

  // Сеанс 5: Каскадеры в Балтике
  const time5 = new Date(today);
  time5.setHours(14, 30, 0, 0);
  const session5 = await prisma.session.create({
    data: {
      filmId: film6.id,
      hallId: hallBaltika!.id,
      startTime: time5,
      endTime: new Date(time5.getTime() + film6.duration * 60000),
      price: 350,
    },
  });

  // Сеанс 6: Леон в Разливное пиво
  const time6 = new Date(today);
  time6.setHours(14, 50, 0, 0);
  const session6 = await prisma.session.create({
    data: {
      filmId: film4.id,
      hallId: hallBeer!.id,
      startTime: time6,
      endTime: new Date(time6.getTime() + film4.duration * 60000),
      price: 420,
    },
  });

  // Сеанс 7: Серебряные коньки в ЗОЖ
  const time7 = new Date(today);
  time7.setHours(16, 0, 0, 0);
  const session7 = await prisma.session.create({
    data: {
      filmId: film5.id,
      hallId: hallZOZH!.id,
      startTime: time7,
      endTime: new Date(time7.getTime() + film5.duration * 60000),
      price: 330,
    },
  });


  // 6. Создаем билеты
  await prisma.ticket.create({
    data: {
      sessionId: session1.id,
      userId: client.id,
      seat: 'A1',
      status: 'PAID',
    },
  });

  await prisma.ticket.create({
    data: {
      sessionId: session2.id,
      userId: client.id,
      seat: 'B5',
      status: 'RESERVED',
    },
  });

  await prisma.review.create({
    data: {
      filmId: film4.id, // Леон
      userId: client.id,
      rating: 5,
      comment: 'Лучший фильм! Невероятная игра Жана Рено. Смотрел уже 5 раз.',
    },
  });

  await prisma.review.create({
    data: {
      filmId: film2.id, // Брат 2
      userId: admin.id,
      rating: 5,
      comment: 'Культовая классика российского кино. Сергей Бодров - легенда!',
    },
  });
}

main()
  .catch((e) => {
    console.error('Ошибка при заполнении БД:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
