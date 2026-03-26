# ── Stage 1: Build the Vite/React app ────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json tsconfig.json ./
COPY lib/ ./lib/
COPY artifacts/sandro-industrial/ ./artifacts/sandro-industrial/
COPY attached_assets/ ./attached_assets/

# Install all workspace deps
RUN pnpm install --frozen-lockfile

# Build Vite frontend
WORKDIR /app/artifacts/sandro-industrial
RUN BASE_PATH=/ PORT=5173 pnpm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/artifacts/sandro-industrial/dist/public /usr/share/nginx/html

# Nginx config: serve SPA + proxy /api to backend
COPY nginx.conf /etc/nginx/conf.d/app.conf

EXPOSE 80
