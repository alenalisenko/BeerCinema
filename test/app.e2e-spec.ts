import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Требует доступной БД из DATABASE_URL (.env)
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/films (GET) отдает список фильмов', () => {
    return request(app.getHttpServer())
      .get('/api/films')
      .expect(200)
      .expect((res) => {
        if (!Array.isArray(res.body.data)) {
          throw new Error('Ожидался массив data в ответе');
        }
      });
  });

  it('/graphql отвечает на запрос', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ __typename }' })
      .expect(200);
  });
});
