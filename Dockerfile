# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copy package files first for better layer caching
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY shared/package.json ./shared/

# 2. Use a cache mount for npm to speed up subsequent builds
# Note: We install ALL dependencies here so we can actually build the app.
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace=backend --include=dev

# 3. Copy source code
COPY shared ./shared
COPY apps/backend ./apps/backend

# 4. Build the application (now has access to Nest CLI and TS)
RUN npm run build --workspace=backend

# 5. Prune devDependencies AFTER build to keep the node_modules small
RUN npm prune --omit=dev --workspace=backend

# Use 'ci' for a faster, non-interactive, and reliable install
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace=backend --include=dev --ignore-scripts

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy ONLY the pruned node_modules and the built dist folder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
# If your app needs the package.json to run:
COPY --from=builder /app/apps/backend/package.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]