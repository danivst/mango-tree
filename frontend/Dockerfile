FROM node:20-alpine AS build
WORKDIR /app
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build
WORKDIR /app/frontend
ARG VITE_BASE_API_URL
ENV VITE_BASE_API_URL=$VITE_BASE_API_URL
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build
FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]