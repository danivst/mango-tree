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

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/frontend/dist ./dist
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]