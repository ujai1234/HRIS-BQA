# Stage 1: Build
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./
# Force install devDependencies for building frontend/backend
RUN npm install --legacy-peer-deps --include=dev

# Copy source code
COPY . .

# Build frontend and backend server bundle
RUN npm run build

# Stage 2: Runtime - must match builder OS for native binary compatibility
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/app/data/sqlite.db

# Install prod dependencies and better-sqlite3 native compilation tools
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Only install production dependencies!
RUN npm ci --omit=dev --legacy-peer-deps

# Remove the compilation tools to save hundreds of megabytes of space
RUN apt-get purge -y python3 make g++ && apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy built frontend/backend from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Ensure data directory exists for persistent SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Healthcheck: wait 60s before first check (server needs time to start + seed DB)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start HRIS application
CMD ["npm", "run", "start"]
