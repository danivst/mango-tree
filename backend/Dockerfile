FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build TypeScript
COPY . .
RUN npm run build

# Expose the port your backend runs on
EXPOSE 3000

# Start the compiled JS code
CMD ["node", "dist/server.js"]