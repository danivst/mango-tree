# Stage 1: Build the React/Vite app
FROM node:20-alpine AS build

WORKDIR /app

# Build the Shared package first
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build

# Setup Frontend
WORKDIR /app/frontend

# Accept build arguments
ARG VITE_BASE_API_URL
# Set environment variables for the build process
ENV VITE_BASE_API_URL=$VITE_BASE_API_URL

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source
COPY frontend/ ./

# Build the Vite app
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]