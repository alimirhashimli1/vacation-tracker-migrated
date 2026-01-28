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

## Absence Domain Model

The application manages various types of employee absences through the `Absence` entity. This model captures the details of requested and approved time off.

### Absence Entity Fields

*   `id`: Unique identifier (UUID, primary key).
*   `userId`: Foreign key linking to the `User` entity, indicating which employee the absence belongs to.
*   `type`: The category of absence (e.g., `VACATION`, `SICK`, `MATERNITY`, `PATERNITY`, `PARENTAL`, `OTHER`).
*   `startDate`: The start date of the absence.
*   `endDate`: The end date of the absence.
*   `status`: The current state of the absence request (`PENDING`, `APPROVED`, `REJECTED`).
*   `requestedDays`: The total number of days requested for the absence, calculated automatically based on `startDate` and `endDate`. This value is set when the absence request is created or updated.
*   `approvedDays`: The total number of days officially approved for the absence. This value is calculated and set only when the `status` of the absence is changed to `APPROVED`. If the request is `PENDING` or `REJECTED`, `approvedDays` will be `0`.
*   `createdAt`: Timestamp of absence record creation.
*   `updatedAt`: Timestamp of last absence record update.

### Distinction Between `requestedDays` and `approvedDays`

*   **`requestedDays`**: Represents the initial or adjusted number of days an employee *asks* for when submitting or modifying an absence request. It's a reflection of the employee's desired time off.
*   **`approvedDays`**: Represents the final number of days that have been *granted* for the absence. This field is only populated when an absence request's `status` is explicitly set to `APPROVED`. If the request is `PENDING` or `REJECTED`, `approvedDays` will be `0`. This distinction allows for tracking the difference between what was asked for and what was ultimately granted.

### User Entity Fields

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

### SUPERADMIN Management

The `SUPERADMIN` role is a privileged role with full system access and requires special handling:

*   **Database-Only Creation and Management**: `SUPERADMIN` users cannot be created or deleted via the API. Their creation and initial setup (including setting passwords) must be performed directly through database operations or dedicated seed scripts (e.g., `apps/backend/src/seeds/superadmin.seeder.ts`).
*   **Credential Rotation**: To rotate `SUPERADMIN` credentials (e.g., change email or password), direct modification in the database is required. For password changes, ensure the new password is hashed using a compatible algorithm (e.g., `bcrypt`).
*   **Warning**: Exercise extreme caution when managing `SUPERADMIN` accounts. Direct database manipulation carries a risk of data corruption if not performed correctly. Always back up your database before making manual changes.


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

## Authorization & Guards

The application implements a robust authorization system using NestJS Guards and custom decorators to control access to routes based on user roles and authentication status.

### Global JWT Authentication Guard

A `JwtAuthGuard` is applied globally to secure most API endpoints. This guard automatically extracts and validates the JWT from the `Authorization` header.

*   **Public Routes**: Routes explicitly marked with the `@Public()` decorator bypass the `JwtAuthGuard`, allowing unauthenticated access (e.g., the login endpoint).

### Role-Based Access Control (RBAC) with `RolesGuard`

The `RolesGuard` works in conjunction with the `@Roles()` decorator to enforce role-based access.

*   **`@Roles()` Decorator**: This custom decorator is used on controllers or individual route handlers to specify the `Role(s)` required to access that resource (e.g., `@Roles(Role.Admin)`).
*   **`RolesGuard` Logic**:
    *   It retrieves the required roles from the route's metadata using the `Reflector`.
    *   It checks the authenticated user's roles (extracted from the JWT payload) against the required roles.
    *   **SuperAdmin Bypass**: Users with the `SUPERADMIN` role are granted access regardless of the specific roles required by the route, effectively bypassing all `RolesGuard` checks.

### Exception Handling

*   **`UnauthorizedException`**: Thrown by the `JwtAuthGuard` or `JwtStrategy` if authentication fails (e.g., invalid or missing token, inactive user).
*   **`ForbiddenException`**: Thrown by the `RolesGuard` if the authenticated user does not possess the required role(s) for a resource. Also explicitly thrown in business logic (e.g., `UsersController`) to enforce specific role-based restrictions (e.g., an ADMIN attempting to modify a SUPERADMIN).