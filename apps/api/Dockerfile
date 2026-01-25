# syntax=docker/dockerfile:1

# Build stage
FROM node:22.13-alpine3.21 AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api/ ./apps/api/

# Build and prune dev dependencies
RUN pnpm --filter @repo/api build \
    && pnpm prune --prod

# Runtime stage
FROM node:22.13-alpine3.21 AS runtime

LABEL org.opencontainers.image.title="Uberclone API" \
      org.opencontainers.image.description="Backend API service for Uberclone" \
      org.opencontainers.image.vendor="Uberclone" \
      org.opencontainers.image.source="https://github.com/your-org/uberclone" \
      org.opencontainers.image.licenses="MIT"

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 hono

WORKDIR /app

# Copy only production artifacts
COPY --from=builder --chown=hono:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=hono:nodejs /app/apps/api/package.json ./
COPY --from=builder --chown=hono:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=hono:nodejs /app/apps/api/node_modules ./apps/api/node_modules

ENV NODE_ENV=production
ENV PORT=3000

USER hono

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
