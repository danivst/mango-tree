FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build
RUN npm link ../shared
EXPOSE 3000
CMD ["node", "-r", "tsconfig-paths/register", "dist/backend/src/server.js"]