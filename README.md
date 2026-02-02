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

### Holiday & Date Logic

The application includes a system for managing public holidays and performing date-related calculations, essential for accurately tracking workdays and absences.

#### Holiday Seeding

Public holidays for Germany are automatically seeded into the database. This process is managed by the `HolidaySeeder`.

-   **Data Source**: Holiday data is fetched from the [Nager.Date API](https://date.nager.at/), a free and open-source project for worldwide public holidays.
-   **Execution**: The seeder can be run using the `npm run seed` command in the `apps/backend` directory. It fetches the current year's holidays for Germany and stores them in the `holidays` table. The seeder is designed to be idempotent; it checks if a holiday for a specific date and region already exists before inserting a new record.

#### Regional Support

The holiday system supports both national and region-specific holidays.

-   **National Holidays**: Holidays that apply to all of Germany are stored with the region code `DE`.
-   **Regional Holidays**: Holidays specific to a German federal state (e.g., Internationaler Frauentag in Berlin) are stored with their corresponding ISO 3166-2 code (e.g., `DE-BE`).
-   **Holiday Checks**: When a service needs to check if a date is a holiday (e.g., `HolidaysService.isHoliday`), it checks for both the user's specific region and the nationwide (`DE`) holidays. This ensures that a user in Berlin will have both Berlin-specific and all-German holidays accounted for.

#### DateUtils Service

A utility service, `DateUtils`, provides helper functions for common date calculations.

-   **`isWeekend(date)`**: Returns `true` if the given date falls on a Saturday or Sunday.
-   **`getWorkingDaysBetween(startDate, endDate, region)`**: Calculates the number of working days between two dates. It excludes weekends and public holidays (both regional and national) for the specified `region`. This is crucial for accurately calculating the duration of vacation requests.

#### Absence Balance Calculation

The system dynamically calculates a user's vacation balance based on their yearly allowance and approved absences.

-   **Yearly Allowance**: Each user has a default yearly vacation allowance (currently hardcoded at 30 days). In future iterations, this could be made configurable per user or based on other criteria.
-   **Used Absence Days**: Only absences with `status: APPROVED` and `type: VACATION` contribute to the used days. The `approvedDays` property of these absences is summed up for the given year.
-   **Remaining Days**: The remaining vacation days are always calculated dynamically as `Yearly Allowance - Used Absence Days`. There is no persistent storage for remaining days.
-   **Service-Level Validation**: When a new absence request of type `VACATION` is created or an existing one is updated, the system performs a validation check. If the `requestedDays` for the absence would cause the user to exceed their available yearly balance, the request is rejected with a `BadRequestException`. This ensures that users cannot request more vacation days than they are entitled to.

### Absence Request Flow

The system enforces several rules and validations during the creation and modification of absence requests to maintain data integrity and business logic.

-   **Authorization for Creation**:
    -   `EMPLOYEE` users can only create absence requests for themselves. Attempts to create an absence for another user will result in a `ForbiddenException`.
    -   `ADMIN` and `SUPERADMIN` users have the authority to create absence requests for any user.
-   **Date Range and Overlap Validation**:
    -   All absence requests are validated to ensure they cover actual working days. Requests consisting solely of weekends or public holidays (national or region-specific) will be rejected.
    -   New absence requests are checked for overlaps with any existing `APPROVED` absences for the same user. Overlapping requests are rejected.
    -   When an existing absence is updated, it's also checked for overlaps, excluding itself from the check.
-   **Vacation Balance Check**:
    -   For absence requests of `type: VACATION`, a check is performed against the user's remaining yearly vacation balance.
    -   If the `requestedDays` for the vacation would cause the user to exceed their available balance, the request is rejected with a `BadRequestException`.
-   **Default Status**: All newly created absence requests are automatically assigned a `status` of `PENDING`.
-   **Persistence**: Validated absence requests are persisted in the database upon creation or update.

### Approval Workflow

The approval process for absence requests is managed with strict authorization and transactional integrity.

-   **Authorization for Approval/Rejection**:
    -   Only users with `ADMIN` or `SUPERADMIN` roles have the authority to approve or reject absence requests. `EMPLOYEE` users are restricted from performing these actions. This is enforced at the controller level using `@Roles` decorators and `RolesGuard`.
-   **On Approval**:
    -   When an absence request's status is changed to `APPROVED`:
        -   The `approvedDays` for that absence are set to its `requestedDays`.
        -   A re-validation of the user's vacation balance is performed to ensure that approving the request does not exceed their remaining yearly allowance. If it does, the approval is rejected.
    -   The approval automatically impacts the user's overall vacation balance by contributing to their `usedDays`, which is dynamically calculated.
-   **On Rejection**:
    -   When an absence request's status is changed to `REJECTED`:
        -   The `approvedDays` for that absence are reset to `0`.
        -   Rejected absences have no impact on the user's vacation balance.
-   **Preventing Re-processing**:
    -   Once an absence request has been `APPROVED` or `REJECTED`, its status becomes final. The system prevents any further attempts to change the status of such processed absences, ensuring state immutability.
-   **Database Transactions**:
    -   All critical updates to absence requests, especially those involving status changes and balance validations, are wrapped within a database transaction. This ensures atomicity, preventing race conditions and guaranteeing the consistency of vacation balances and absence statuses even under concurrent operations.

### Absence Entity Fields

*   `id`: Unique identifier (UUID, primary key).
*   `userId`: Foreign key linking to the `User` entity, indicating which employee the absence belongs to.
*   `type`: The category of absence (e.g., `VACATION`, `SICK`, `MATERNITY`, `PATERNITY`, `PARENTAL`, `OTHER`).
*   `startDate`: The start date of the absence.
*   `endDate`: The end date of the absence.
*   `status`: The current state of the absence request (`PENDING`, `APPROVED`, `REJECTED`).
*   `requestedDays`: The total number of days requested for the absence, calculated automatically based on `startDate` and `endDate`. This value is set when the absence request is created or updated.
*   `approvedDays`: The total number of days officially approved for the absence. This field is only populated when an absence request's `status` is explicitly set to `APPROVED`. If the request is `PENDING` or `REJECTED`, `approvedDays` will be `0`. This distinction allows for tracking the difference between what was asked for and what was ultimately granted.
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
    -   No user, regardless of role, can create an account with the `SUPERADMIN` role.
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
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d 
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

A successful response will return an `access_token`:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

You can then use this `access_token` to access protected resources, for example, the user profile:

```bash
curl -X GET http://localhost:3000/auth/profile \
-H "Authorization: Bearer <your_access_token>"
```

## Authorization & Guards

The application implements a robust authorization system using NestJS Guards and custom decorators to control access to routes based on user roles and authentication status.

### Global JWT Authentication Guard

A `JwtAuthGuard` is applied globally to secure most API endpoints. This guard automatically extracts and validates the JWT from the `Authorization` header.

*   **Public Routes**: Routes explicitly marked with the `@Public()` decorator bypass the `JwtAuthGuard`, allowing unauthenticated access (e.g., the login endpoint).

### Role-Based Access Control (RBAC) with `RolesGuard`

The `RolesGuard` works in conjunction with the `@Roles()` decorator to enforce role-based access.

*   **`@Roles()` Decorator**: This custom decorator is used on controllers or individual route handlers to specify the `Role(s)` required to access that resource (e.g., `@Roles(Role.Admin)`)
*   **`RolesGuard` Logic**:
    *   It retrieves the required roles from the route's metadata using the `Reflector`.
    *   It checks the authenticated user's roles (extracted from the JWT payload) against the required roles.
    *   **SuperAdmin Bypass**: Users with the `SUPERADMIN` role are granted access regardless of the specific roles required by the route, effectively bypassing all `RolesGuard` checks.

### Exception Handling

*   **`UnauthorizedException`**: Thrown by the `JwtAuthGuard` or `JwtStrategy` if authentication fails (e.g., invalid or missing token, inactive user).
*   **`ForbiddenException`**: Thrown by the `RolesGuard` if the authenticated user does not possess the required role(s) for a resource. Also explicitly thrown in business logic (e.g., `UsersController`) to enforce specific role-based restrictions (e.g., an ADMIN attempting to modify a SUPERADMIN).

## Edge Cases & Constraints

This section outlines specific rules and constraints implemented in the absence management system to ensure data integrity and adhere to business logic.

*   **Prevent Overlapping Absences**: Absence requests will be rejected if they overlap with any existing `APPROVED` absence blocks for the same user.
*   **Cross-Year Vacation Restriction**: `VACATION` type absences cannot span across multiple calendar years. Requests attempting to do so will be rejected. Other absence types (`SICK`, `MATERNITY`, etc.) are permitted to span years.
*   **Partial Approvals**: The system supports partial approvals for absence requests. When an absence request is approved, the `approvedDays` can be set to a value less than or equal to the `requestedDays`.
    *   `approvedDays` must be non-negative.
    *   `approvedDays` cannot exceed `requestedDays`.
    *   If an absence is not `APPROVED` (e.g., `PENDING` or `REJECTED`), its `approvedDays` will be `0`.
    *   If an absence is `APPROVED` and no specific `approvedDays` value is provided during an update, `approvedDays` will default to `requestedDays`.
*   **Meaningful Error Messages**: The system provides specific and clear error messages for common scenarios:
    *   "Vacation balance exceeded": When a `VACATION` request would cause a user to exceed their available yearly balance.
    *   "Date overlaps with existing absence": When a new or updated absence request clashes with an already `APPROVED` absence.
    *   "Public holidays cannot be requested": When an absence request consists solely of non-working days (weekends and public holidays).

## API Route Discovery

For development and debugging purposes, the application automatically logs all registered API routes to the console upon startup. This feature provides a clear and immediate overview of all available endpoints, their HTTP methods, and their paths.

### How It Works

When the backend server starts, a script in `apps/backend/src/main.ts` accesses the application's underlying router and iterates through all registered route layers. It then logs the HTTP method (e.g., `GET`, `POST`) and the full path for each endpoint.

### Viewing the Routes

To see the list of all API routes, simply start the backend server in development mode:

```bash
npm run start:dev
```

The routes will be printed to the console shortly after the application bootstraps, prefixed with `[Routes]`.

## Invitation Module

This module handles the creation and management of invitations for new user registrations. It enables an invite-only registration process where administrators can send invitations to prospective users.

### Invitation Entity Fields

*   `id`: Unique identifier (UUID, primary key).
*   `email`: The email address of the invitee (unique).
*   `role`: The role assigned to the invitee upon successful registration (e.g., `ADMIN`, `EMPLOYEE`).
*   `token`: A unique, plain (unhashed) token used for the invitation link.
*   `expiresAt`: Timestamp indicating when the invitation token expires.
*   `usedAt`: Timestamp indicating when the invitation was successfully used to register a user (nullable).
*   `status`: The current state of the invitation (`PENDING`, `ACCEPTED`, `EXPIRED`).
*   `invitedById`: Foreign key linking to the `User` entity, indicating which user sent the invitation.
*   `createdAt`: Timestamp of invitation record creation.
*   `updatedAt`: Timestamp of last invitation record update.

### Constraints

*   **`SUPERADMIN` Role Not Allowed**: Invitations cannot be created for the `SUPERADMIN` role. Attempts to create such an invitation will be rejected.
*   **Unique Active Invitations**: Only one active (PENDING and not expired) invitation can exist for a given email address at any time. If an active invitation already exists for an email, a new invitation for that email cannot be created until the existing one is either accepted or expires.
*   **Inviter Authorization**: Only users with `ADMIN` or `SUPERADMIN` roles can create invitations. The ID of the inviting user is recorded in the `invitedById` field.
*   **Token Storage**: Invitation tokens are stored as plain UUIDs. They are not hashed in the database.
