import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { createTestApp, setupTestDatabase, closeTestApp } from './test-utils';

describe('Smoke Test (Integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    ({ app, moduleFixture } = await createTestApp());
    await setupTestDatabase(moduleFixture);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World from Backend!');
  });
});
