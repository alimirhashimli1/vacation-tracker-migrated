import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import { SeedingService } from '../src/seeds/seeding.service';

// Load .env.test before any other imports that might use process.env
dotenv.config({ path: path.join(__dirname, '../.env.test') });

export async function createTestApp(): Promise<{ app: INestApplication; moduleFixture: TestingModule }> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      AppModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  return { app, moduleFixture };
}

export async function setupTestDatabase(moduleFixture: TestingModule) {
  const seedingService = moduleFixture.get(SeedingService);
  await seedingService.resetAndSeed();
}

/**
 * Truncates all tables in the database to ensure isolation.
 */
export async function truncateDatabase(moduleFixture: TestingModule) {
  const dataSource = moduleFixture.get(DataSource);
  const entities = dataSource.entityMetadatas;

  const tableNames = entities
    .map((entity) => `"${entity.tableName}"`)
    .join(', ');

  if (tableNames) {
    await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`);
  }
}

export async function closeTestApp(app: INestApplication) {
  await app.close();
}
