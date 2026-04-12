# Deployment Guide

This guide provides instructions for deploying the application in a production environment using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on the target server.
- A domain name (optional but recommended).
- SMTP credentials for email notifications.

## 1. Environment Setup

Create a `.env` file in the root directory based on `.env.example`.

```bash
cp apps-backend/.env.example .env
```

Edit the `.env` file with production values:

- `NODE_ENV=production`
- `JWT_SECRET`: Generate a strong random string.
- `DATABASE_PASSWORD`: Use a strong password.
- `SUPERADMIN_EMAIL` & `SUPERADMIN_PASSWORD`: Credentials for the first login.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`: SMTP settings.
- `FRONTEND_URL`: The URL where the frontend will be accessible.

## 2. Security Recommendations

- **Non-Root Users**: The backend Docker image is configured to run as a non-root `node` user.
- **Database**: Ensure the database port is not exposed to the public internet unless necessary. The `docker-compose.yml` defaults to internal communication.
- **SSL/TLS**: Use a reverse proxy like Nginx or Traefik with Let's Encrypt to provide HTTPS.

## 3. Deployment Steps

Run the following command to build and start the containers in detached mode:

```bash
docker-compose up -d --build
```

## 4. Verification

- Backend: `http://your-server-ip:3000/api` (or configured port)
- Frontend: `http://your-server-ip` (or configured port)
- Database: Verify connectivity via logs: `docker-compose logs -f backend`

## 5. Post-Deployment

- Log in with the SuperAdmin credentials defined in `.env`.
- Change the SuperAdmin password immediately after the first login.
- Disable `DATABASE_SYNCHRONIZE` by setting it to `false` (default in production) to prevent accidental schema changes.

## 6. Maintenance

To update the application:

```bash
git pull
docker-compose up -d --build
```

To view logs:

```bash
docker-compose logs -f
```
