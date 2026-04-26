FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
COPY .env ./
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]