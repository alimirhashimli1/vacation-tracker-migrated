# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM nginx:stable-alpine

# Use a non-root user if possible (nginx alpine uses nginx user)
# However, standard nginx image needs root for port 80.
# We can use a custom nginx config to run on 8080 and as non-root.

# For simplicity, we'll keep nginx:stable-alpine but minimize the image.
# We'll use a safer configuration.

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
