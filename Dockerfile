# Stage 1: Build
# Note: better-sqlite3 v13+ requires Node.js >= 22
FROM node:22 AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./
# Force install devDependencies even if NODE_ENV=production is set by deployment environment
RUN npm install --legacy-peer-deps --include=dev

# Copy source code
COPY . .

# Build frontend and backend server bundle
RUN npm run build

# Stage 2: Runtime - must match builder exactly so native binaries are compatible
FROM node:22 AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/app/data/sqlite.db

# Copy built frontend/backend and node_modules from builder
# Same base image (node:22) ensures better-sqlite3 native binary is ABI-compatible
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Ensure data directory exists for persistent SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Healthcheck: wait 60s before first check (server needs time to start + seed DB)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start HRIS application
CMD ["npm", "run", "start"]
