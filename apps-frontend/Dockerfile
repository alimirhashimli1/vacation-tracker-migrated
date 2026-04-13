# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY apps-backend/package*.json ./apps-backend/
COPY apps-frontend/package*.json ./apps-frontend/

# Install dependencies
RUN npm ci

# Copy source code
COPY apps-frontend/ ./apps-frontend/

# Set working directory to the app folder for build
WORKDIR /app/apps-frontend

# Pass environment variable for build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM nginx:stable-alpine

# Copy built files from build stage
COPY --from=build /app/apps-frontend/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY apps-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
