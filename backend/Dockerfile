FROM node:20-alpine

WORKDIR /app

# Build Shared
COPY shared/ ./shared/
RUN cd shared && npm install && npm run build

# Setup Backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Build (This creates the 'dist' folder)
RUN npm run build

# EXPOSE AND RUN
EXPOSE 3000

# Use the npm start script instead of direct node command
# This ensures tsconfig-paths/register is loaded to find @mangotree/shared
CMD ["npm", "start"]