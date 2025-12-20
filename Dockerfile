# ==========================
# Build stage
# ==========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (dev + prod) for building
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ==========================
# Production stage
# ==========================
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for Drizzle)
# This is required because drizzle-kit is usually a devDependency
RUN npm ci

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY shared ./shared
COPY drizzle.config.ts ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
# Run migrations first, then start Node.js server
CMD ["sh", "-c", "npx drizzle-kit push && node --experimental-specifier-resolution=node dist/index.js"]
