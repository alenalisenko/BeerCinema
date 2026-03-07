import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { create } from 'express-handlebars';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const publicPath = join(__dirname, '..', 'public');
  const viewsPath = join(__dirname, '..', 'views');

  // Статические файлы (картинки, CSS, JS)
  app.useStaticAssets(publicPath);
  
  // Handlebars шаблонизатор
  const hbs = create({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: viewsPath,
    partialsDir: join(viewsPath, 'partials'),
  });

  app.engine('hbs', hbs.engine);
  app.set('view engine', 'hbs');
  app.set('views', viewsPath);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`App running on http://localhost:${port}`);
}
bootstrap();