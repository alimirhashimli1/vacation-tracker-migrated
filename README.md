# Backend Application

This project serves as the backend for an application, built with the [NestJS](https://github.com/nestjs/nestjs) framework.

## Description

This is a NestJS TypeScript starter repository that has been extended and configured to provide a robust backend for managing users, authentication, invitations, and absence tracking.

## Architectural Notes

This project is designed as a standalone backend service. While certain file paths previously hinted at a multi-application (`apps/backend`) structure, these were corrected to reflect a single, cohesive backend application within this repository. No polyrepo architectural changes were implemented; the focus remains on a streamlined, single-repository backend deployment.

## Key Features & Recent Enhancements

This project includes:
*   User Management (CRUD operations)
*   Authentication (Local strategy with JWT)
*   Role-Based Access Control (RBAC)
*   Invitation System for new user onboarding
*   Absence Tracking
*   Holiday Management
*   Email integration for invitations
*   Robust environment variable configuration
*   Database seeding for initial setup (SuperAdmin, holidays)

Significant work has been done to ensure smooth application setup, database interaction, and user workflow:

### 1. Environment Configuration (`.env` file)

The application relies heavily on environment variables for configuration.
*   A `.env.example` file is provided as a template.
*   **Crucially, you must create a `.env` file in the project root and populate it with your actual credentials.**
*   **Required Variables:**
    *   **Database:** `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` (for PostgreSQL).
    *   **JWT:** `JWT_SECRET` (a strong, random string).
    *   **Mailer:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `MAILER_SECURE`.

### 2. Database Setup and Seeding

To get your application fully functional and create the initial SuperAdmin user:

1.  **Ensure PostgreSQL is running** and accessible.
2.  **Create your database** (e.g., `vacation_db`).
3.  **Create a dedicated database user** for the application (e.g., `your_app_user`).
4.  **Grant comprehensive permissions** to your application's database user on the database and its schema. This typically involves commands like:
    ```sql
    GRANT ALL PRIVILEGES ON DATABASE vacation_db TO your_app_user;
    GRANT ALL PRIVILEGES ON SCHEMA public TO your_app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO your_app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO your_app_user;
    ```
    (Run these while connected as a PostgreSQL superuser like `postgres`).
5.  **Run the database seeder:** This script creates the database schema and seeds the initial SuperAdmin user.
    ```bash
    pnpm run seed
    ```
    *   **Note:** The SuperAdmin user's default credentials are:
        *   **Email:** `alimirhashimli@gmail.com`
        *   **Password:** `1Kaybettim.`

### 3. Authentication & User Workflow

*   **Login:** Use `POST /auth/login` with `email` and `password`. The system verifies `emailVerified` and `isActive` status.
*   **Invitation System:**
    1.  An authenticated Admin/SuperAdmin uses `POST /invitations` to create an invitation for a new user.
    2.  The API response for `POST /invitations` will contain a `plainToken`.
    3.  The new user (or the admin on their behalf) then uses this `plainToken` along with their `firstName`, `lastName`, `email`, and `password` in a `POST /auth/register` request. This completes their registration and marks their email as verified.

### 4. Mailer Configuration

*   The application includes email sending capabilities, especially for user invitations.
*   Ensure your `SMTP_*` environment variables in `.env` are correctly configured for your email service provider (e.g., SendGrid, Mailtrap, Gmail). Placeholder values (e.g., `smtp.example.com`) will result in `ENOTFOUND` errors.
*   The email templates are located in `src/templates`. The path has been corrected to `process.cwd() + '/src/templates'` to avoid `ENOENT` errors.

### 5. API Testing

An `example.http` file has been generated in the project root. This file contains example requests for all major API endpoints, allowing for easy testing with REST Client extensions (like the one in VS Code).

## Installation

```bash
$ npm install # or pnpm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please read more here:
[Contributing](https://nestjs.com/sponsor)

## License

Nest is [MIT licensed](LICENSE).
