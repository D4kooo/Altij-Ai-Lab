# Stage 1: Install dependencies
FROM oven/bun:1-debian AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/app/package.json apps/app/
COPY apps/public/package.json apps/public/
COPY packages/shared/package.json packages/shared/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN bun install --frozen-lockfile

# Stage 2: Build SPAs
FROM base AS build-spa
COPY tsconfig.json ./
COPY packages/shared/ packages/shared/
COPY apps/app/ apps/app/
COPY apps/public/ apps/public/

ENV NODE_ENV=production
RUN cd apps/app && bun run build
RUN cd apps/public && bun run build

# Stage 3: Build API
FROM base AS build-api
COPY tsconfig.json ./
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

ENV NODE_ENV=production
RUN cd apps/api && bun run build

# Stage 4: Runtime
FROM oven/bun:1-debian AS runtime
WORKDIR /app

# API bundle
COPY --from=build-api /app/apps/api/dist/ apps/api/dist/

# PDF templates (runtime, resolved via import.meta.dir)
COPY --from=build-api /app/apps/api/src/templates/ apps/api/src/templates/

# Drizzle migrations
COPY --from=build-api /app/apps/api/drizzle.config.ts apps/api/
COPY --from=build-api /app/apps/api/src/db/migrations/ apps/api/src/db/migrations/
COPY --from=build-api /app/apps/api/package.json apps/api/

# drizzle-kit needs these at runtime for migrations
COPY --from=build-api /app/node_modules/ node_modules/
COPY --from=build-api /app/apps/api/node_modules/ apps/api/node_modules/

# SPA static files (served by Hono serveStatic)
COPY --from=build-spa /app/apps/app/dist/ apps/api/static/app/
COPY --from=build-spa /app/apps/public/dist/ apps/api/static/public/

# Polyfills (preloaded before app for DOMMatrix etc.)
COPY polyfills.js .

# Entrypoint
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production

# SECURITY: Run as non-root user
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
