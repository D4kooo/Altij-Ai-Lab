#!/bin/bash
set -e

echo "Running database migrations..."
cd /app/apps/api && bunx drizzle-kit migrate

echo "Starting server..."
cd /app/apps/api
exec bun run --preload /app/polyfills.js /app/apps/api/dist/index.js
