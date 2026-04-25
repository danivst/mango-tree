FROM node:20-alpine

WORKDIR /app

# Build Shared
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build

# Setup Backend
WORKDIR /app/backend

# Copy .env from root to backend ---
COPY .env ./

COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Build (This creates the 'dist' folder)
RUN npm run build

EXPOSE 3000

# Use the npm start script
CMD ["npm", "start"]