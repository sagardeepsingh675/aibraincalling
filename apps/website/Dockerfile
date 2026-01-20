FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Expose port
EXPOSE 3000

# Serve with a simple server
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
