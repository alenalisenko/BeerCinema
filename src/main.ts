import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { join } from 'path';
import { create } from 'express-handlebars';
import session from 'express-session';
import './auth/session-user';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const publicPath = join(process.cwd(), 'public');
  const viewsPath = join(process.cwd(), 'views');

  // Статические файлы (картинки, CSS, JS)
  app.useStaticAssets(publicPath);

  // Сессии: авторизованный пользователь хранится в server-side сессии,
  // браузеру уходит только httpOnly-кука с id сессии
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'beercinema-dev-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
    }),
  );
  
  // Handlebars шаблонизатор
  const hbs = create({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: viewsPath,
    partialsDir: join(viewsPath, 'partials'),
    helpers: {
      eq: (a: unknown, b: unknown) => a == b,
      // Показывать ли элементы управления фильмами/сеансами
      isManager: (u: { role?: string } | null) =>
        !!u && (u.role === 'MANAGER' || u.role === 'ADMIN'),
    },
  });

  app.engine('hbs', hbs.engine);
  app.set('view engine', 'hbs');
  app.set('views', viewsPath);

  // Глобальная валидация DTO — возвращает 400 при неверных данных
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Глобальный обработчик ошибок (Prisma + HTTP exceptions)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger — документация по адресу /api/docs
  const config = new DocumentBuilder()
    .setTitle('BeerCinema API')
    .setDescription('REST API для системы управления кинотеатром')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`App running on http://localhost:${port}`);
}
bootstrap();