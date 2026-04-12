# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (frozen-lockfile for consistency)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Ensure templates are copied to dist if the build tool missed them
RUN cp -r src/templates dist/templates || true

# Stage 2: Production image
FROM node:20-alpine

# Use non-root user
USER node

WORKDIR /home/node/app

# Copy built files from build stage
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package*.json ./

# Set environment to production
ENV NODE_ENV=production

EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
