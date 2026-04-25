# Stage 1: Build the React/Vite app
FROM node:20-alpine AS build

WORKDIR /app

# Build the Shared package first
COPY shared/package*.json ./shared/
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build

# Setup Frontend
WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Fix the Rollup/Vite platform error
RUN npm install --os=linux --cpu=x64

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