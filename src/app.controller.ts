import { Controller, Get, Query, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { FilmsService } from './films/films.service';
import { SessionsService } from './sessions/sessions.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(
    private readonly filmsService: FilmsService,
    private readonly sessionsService: SessionsService,
  ) {}

  @Get()
  @Render('index')
  async getIndex(@Query('auth') auth?: string) {
    // Получаем фильмы с сеансами из БД
    const filmsFromDB = await this.filmsService.findAll();
    
    // Форматируем для отображения
    const films = filmsFromDB.map(film => {
      const firstSession = film.sessions[0];
      return {
        title: film.title,
        time: firstSession ? this.formatTime(firstSession.startTime) : '',
        image: film.posterUrl.replace('/assets/images/', ''),
      };
    });

    // Получаем расписание на сегодня
    const sessions = await this.sessionsService.findByDate(new Date());
    const schedule = sessions.map(session => ({
      film: session.film.title,
      time: this.formatTime(session.startTime),
      hall: session.hall.name,
    }));

    const user = auth === 'true' ? { name: 'Алёна Лисенко' } : null;

    return { 
      title: 'Главная', 
      films, 
      schedule, 
      user
    };
  }

  private formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
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