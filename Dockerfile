# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
# This runs 'npm run build' which we configured to use vite + esbuild
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose the port (must match server.ts)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
