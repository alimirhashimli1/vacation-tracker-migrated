import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, setupTestDatabase, closeTestApp } from './test-utils';
import { Role } from '../src/shared/role.enum';

describe('Authentication Flow (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { app: testApp, moduleFixture } = await createTestApp();
    app = testApp;
    await setupTestDatabase(moduleFixture);
  }, 30000); // Increase timeout for database setup

  afterAll(async () => {
    await closeTestApp(app);
  });

  const superAdminCredentials = {
    email: 'alimirhashimli@gmail.com',
    password: '1Kaybettim.',
  };

  const newUser = {
    email: 'newuser@example.com',
    password: 'NewUser123.',
    firstName: 'New',
    lastName: 'User',
    role: Role.Employee,
  };

  let superAdminAccessToken: string;
  let invitationToken: string;
  let newUserAccessToken: string;

  describe('SuperAdmin Login', () => {
    it('should login as superadmin and return a JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: superAdminCredentials.email,
          password: superAdminCredentials.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      superAdminAccessToken = response.body.access_token;
    });
  });

  describe('Invitation and Registration', () => {
    it('should create an invitation as superadmin', async () => {
      const response = await request(app.getHttpServer())
        .post('/invitations')
        .set('Authorization', `Bearer ${superAdminAccessToken}`)
        .send({
          email: newUser.email,
          role: newUser.role,
        })
        .expect(201);

      expect(response.body).toHaveProperty('plainToken');
      invitationToken = response.body.plainToken;
    });

    it('should register a new user using the invitation token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          token: invitationToken,
          password: newUser.password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toMatchObject({
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      });
      newUserAccessToken = response.body.access_token;
    });
  });

  describe('Login as New User', () => {
    it('should login with newly registered user credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toBeDefined();
    });
  });

  describe('Guards and Authorization', () => {
    it('should allow access to /auth/profile with a valid JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${newUserAccessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      });
    });

    it('should block access to /auth/profile without a JWT', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should block an employee from creating an invitation', async () => {
      await request(app.getHttpServer())
        .post('/invitations')
        .set('Authorization', `Bearer ${newUserAccessToken}`)
        .send({
          email: 'another@example.com',
          role: Role.Employee,
        })
        .expect(403);
    });
  });
});
