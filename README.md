# Monorepo Root

This is the root of the monorepo, containing shared configuration and housing the `apps` directory for individual applications.

## Database Setup

This backend application uses PostgreSQL for data persistence, integrated via TypeORM. The database connection is configured dynamically using environment variables, ensuring that credentials are not hardcoded and can be easily managed across different environments.

### Connection Details

The application connects to a PostgreSQL database using the following environment variables:

*   `DATABASE_HOST`: The hostname or IP address of the PostgreSQL server (e.g., `localhost`).
*   `DATABASE_PORT`: The port on which the PostgreSQL server is listening (e.g., `5432`).
*   `DATABASE_USER`: The username for connecting to the database (e.g., `user`).
*   `DATABASE_PASSWORD`: The password for the specified user (e.g., `password`).
*   `DATABASE_NAME`: The name of the database to connect to (e.g., `vacation_db`).

These variables are loaded from a `.env` file located in the `apps/backend` directory.

### Entity Synchronization

For development environments (`NODE_ENV` other than `production`), TypeORM's `synchronize` feature is enabled. This means that the database schema will be automatically created or updated to match the defined TypeORM entities on application startup.

**Important:** `synchronize` is explicitly disabled in `production` environments to prevent accidental data loss or unintended schema changes. In production, database schema management should be handled through TypeORM migrations.

## User & Role Model

The application includes a `User` entity to manage user accounts, each associated with a specific `Role`.

### User Entity Fields

*   `id`: Unique identifier (UUID, primary key).
*   `firstName`: User's first name.
*   `lastName`: User's last name.
*   `email`: User's email address (unique and indexed).
*   `password`: Hashed password.
*   `role`: User's assigned role (see Role Hierarchy below).
*   `isActive`: Boolean indicating if the user account is active (default `true`).
*   `createdAt`: Timestamp of account creation.
*   `updatedAt`: Timestamp of last account update.

### Role Hierarchy

Users are assigned one of the following roles, defining their permissions and access levels:

*   `SUPERADMIN`: Highest level of access, typically full control.
*   `ADMIN`: Administrative access, with some restrictions compared to SUPERADMIN.
*   `EMPLOYEE`: Standard user access, usually limited to their own data or specific application features.

### Authorization Rules

The `UsersService` enforces specific authorization rules based on user roles:

*   **`createUser`**:
    *   Only users with `ADMIN` or `SUPERADMIN` roles can create new user accounts.
    *   No user, regardless of role, can create an account with the `SUPERADMIN` role.
*   **`updateUser`**:
    *   `ADMIN` users are restricted from modifying accounts with the `SUPERADMIN` role.
*   **`deleteUser`**:
    *   `ADMIN` users are restricted from deleting accounts with the `SUPERADMIN` role.
*   **`findAll`**:
    *   When an `ADMIN` user requests all users, accounts with the `SUPERADMIN` role will be excluded from the results.
*   **`findOne`**:
    *   Users with the `EMPLOYEE` role can only retrieve their own user profile data.
    *   `ADMIN` and `SUPERADMIN` users can view any user's profile, subject to other update/delete restrictions.

## Authentication

This application uses a local authentication strategy combined with JSON Web Tokens (JWT) for securing API endpoints.

### Authentication Flow

1.  **Local Login**: Users authenticate by sending their `email` and `password` to the `/auth/login` endpoint.
2.  **JWT Generation**: Upon successful authentication, the server generates a JWT containing user information (email, user ID, and role) and returns it as an `access_token`.
3.  **Protected Routes**: To access protected routes, users must include the `access_token` in the `Authorization` header of their requests, prefixed with `Bearer` (e.g., `Authorization: Bearer <your_jwt_token>`). The server then validates the JWT, ensuring the token is valid and the associated user exists and is active.

### Login Request Example

To obtain an access token, send a POST request to `/auth/login` with your user credentials:

```bash
curl -X POST http://localhost:3000/auth/login \\
-H "Content-Type: application/json" \\
-d '{
  "email": "user@example.com",
  "password": "yourpassword"
}'
```

A successful response will return an `access_token`:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

You can then use this `access_token` to access protected resources, for example, the user profile:

```bash
curl -X GET http://localhost:3000/auth/profile \\
-H "Authorization: Bearer <your_access_token>"
```