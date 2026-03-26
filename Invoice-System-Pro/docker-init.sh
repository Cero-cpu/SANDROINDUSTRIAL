#!/bin/sh
# Docker startup script: push DB schema then seed
set -e

echo "==> Pushing database schema..."
npx pnpm --filter @workspace/db run push

echo "==> Seeding database..."
npx --yes tsx@latest scripts/src/seed.ts

echo "==> Done!"
