# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install build tools required for node-gyp
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Create .env.production file from build args (Vite reads from .env.production for production build)
RUN if [ -n "$VITE_API_BASE_URL" ]; then \
      echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" > .env.production && \
      echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" > .env; \
    fi

# Debug: Show env file contents
RUN echo "=== .env.production ===" && cat .env.production || echo "No .env.production" && \
    echo "=== .env ===" && cat .env || echo "No .env" && \
    echo "=== ENV variable ===" && echo "VITE_API_BASE_URL=$VITE_API_BASE_URL"

# Build the application (mode is production by default for vite build)
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Add runtime env file generated from build arg
ARG VITE_API_BASE_URL
RUN echo "window.__API_BASE_URL__=\"${VITE_API_BASE_URL}\";" > /usr/share/nginx/html/env.js

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
