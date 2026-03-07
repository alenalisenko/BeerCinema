import { Controller, Get, Query, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  getIndex(@Query('auth') auth?: string) {
    const films = [
      { title: '100 лет тому вперед', time: '12:00', image: '100years.png' },
      { title: 'Серебряные коньки', time: '12:50', image: 'silver.png' },
      { title: 'Каскадеры', time: '12:55', image: 'kaskader.png' },
      { title: 'Головоломка 2', time: '13:00', image: 'insideout.png' },
      { title: 'Брат 2', time: '13:50', image: 'brat.png' },
      { title: 'Леон', time: '14:00', image: 'leon.png' },
      { title: '12 друзей Оушена', time: '14:30', image: 'friends.png' },
    ];

    const schedule = [
      { film: '100 лет тому вперед', time: '12:00', hall: 'ЗОЖ' },
      { film: 'Брат', time: '12:15', hall: 'Балтика' },
      { film: '12 друзей Оушена', time: '12:45', hall: 'Разливное пиво' },
      { film: 'Головоломка', time: '14:05', hall: 'ЗОЖ' },
      { film: 'Каскадеры', time: '14:30', hall: 'Балтика' },
      { film: 'Леон', time: '14:50', hall: 'Разливное пиво' },
      { film: 'Серебряные коньки', time: '16:00', hall: 'ЗОЖ' },
    ];

    const user = auth === 'true' ? { name: 'Алёна Лисенко' } : null;

    return { 
      title: 'Главная', 
      films, 
      schedule, 
      user,
      useSwiper: true
    };
  }

  @Get('films')
  @Render('films')
  getFilms(@Query('auth') auth?: string) {
    const user = auth === 'true' ? { name: 'Алёна Лисенко' } : null;
    return { 
      title: 'Фильмы', 
      user,
      useSwiper: true,
      useComments: true
    };
  }

  @Get('sessions')
  @Render('sessions')
  getSessions(@Query('auth') auth?: string) {
    const user = auth === 'true' ? { name: 'Алёна Лисенко' } : null;
    return { title: 'Сеансы', user };
  }

  @Get('about')
  @Render('about')
  getAbout(@Query('auth') auth?: string) {
    const user = auth === 'true' ? { name: 'Алёна Лисенко' } : null;
    return { title: 'О нас', user };
  }

  @Get('contacts')
  @Render('contacts')
  getContacts(@Query('auth') auth?: string) {
    const user = auth === 'true' ? { name: 'Алёна Лисенко' } : null;
    return { title: 'Контакты', user };
  }

  @Get('constructor')
  @Render('constructor')
  getConstructor(@Query('auth') auth?: string) {
    const user = auth === 'true' ? { name: 'Алёна Лисенко' } : null;
    return { 
      title: 'Конструктор', 
      user,
      useConstructor: true
    };
  }
}