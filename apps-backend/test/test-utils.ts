import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { HolidaySeeder } from '../src/seeds/holiday.seeder';
import { SuperAdminSeeder } from '../src/seeds/superadmin.seeder';
import { SeederModule } from '../src/seeds/seeder.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { INestApplication, ValidationPipe } from '@nestjs/common';

// Load .env.test before any other imports that might use process.env
dotenv.config({ path: path.join(__dirname, '../.env.test') });

export async function createTestApp(): Promise<{ app: INestApplication; moduleFixture: TestingModule }> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      AppModule,
      SeederModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  return { app, moduleFixture };
}

export async function setupTestDatabase(moduleFixture: TestingModule) {
  const dataSource = moduleFixture.get(DataSource);
  
  // Clean and sync database
  await dataSource.synchronize(true);

  // Seed data
  const holidaySeeder = moduleFixture.get(HolidaySeeder);
  const superAdminSeeder = moduleFixture.get(SuperAdminSeeder);

  await holidaySeeder.seed();
  await superAdminSeeder.seed();
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
