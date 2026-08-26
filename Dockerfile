# Multi-stage build: Frontend + Backend in one image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy monorepo structure
COPY package*.json ./
COPY backend ./backend
COPY frontend ./frontend

# Install all dependencies
RUN npm run install:all

# Build frontend (React)
RUN cd frontend && npm run build

# Build backend (TypeScript → JavaScript)
RUN cd backend && npm run build

# ============================================
# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm ci --only=production && \
    cd backend && npm ci --only=production

# Copy built artifacts from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy runtime files
COPY backend/src ./backend/src
COPY .env* ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5002/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Expose port
EXPOSE 5002

# Start backend server
CMD ["node", "backend/dist/server.js"]