# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY apps-backend/package*.json ./apps-backend/
COPY apps-frontend/package*.json ./apps-frontend/

# Install dependencies
RUN npm install

# FIX: Manually install the Alpine-specific native binary for css-inline
# This fixes the "Cannot find module '@css-inline/css-inline-linux-x64-musl'" error
RUN npm install @css-inline/css-inline-linux-x64-musl

# Copy source code
COPY apps-backend/ ./apps-backend/
COPY apps-frontend/ ./apps-frontend/

# Set working directory to the app folder for build
WORKDIR /app/apps-backend

# Build the application
RUN npm run build

# Ensure templates are copied to dist if the build tool missed them
RUN cp -r src/templates dist/templates || true

# Stage 2: Production image
FROM node:20-alpine

# Use non-root user
USER node

WORKDIR /app

# Copy built files and node_modules, preserving the workspace structure
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps-backend/dist ./apps-backend/dist
COPY --from=build --chown=node:node /app/apps-backend/package*.json ./apps-backend/
COPY --from=build --chown=node:node /app/package*.json ./

# Set environment to production
ENV NODE_ENV=production

EXPOSE 3000

# Start the application using the workspace command
CMD ["npm", "run", "start:prod", "-w", "apps-backend"]
