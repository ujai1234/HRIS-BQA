# Stage 1: Build
FROM node:20 AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build frontend and backend server bundle
RUN npm run build

# Stage 2: Runtime
FROM node:20 AS runner

WORKDIR /app

# (Removed system sqlite3 installation to prevent better-sqlite3 symbol conflicts)

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/app/data/sqlite.db

# Copy files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Ensure data directory exists for persistent SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start HRIS application
CMD ["npm", "run", "start"]
