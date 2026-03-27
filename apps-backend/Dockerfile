# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
