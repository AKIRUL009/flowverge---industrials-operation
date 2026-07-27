# Multi-stage Dockerfile for Cloud Run Deployment

# Step 1: Build phase
FROM node:20-slim AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Step 2: Production runtime
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/flowverge.db* ./

# Expose Cloud Run default port
EXPOSE 8080

# Start server
CMD ["node", "dist/server.cjs"]
