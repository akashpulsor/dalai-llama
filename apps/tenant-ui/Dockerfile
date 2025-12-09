# ------------------------------------------------------------
# Stage 1: Build platform-ui (React/Vite)
# ------------------------------------------------------------
FROM node:20-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy monorepo root package files for dependency resolution
COPY package*.json ./

# Copy shared packages (used by platform-ui)
COPY shared ./shared

# Copy the platform-ui app
COPY apps/tenant-ui ./apps/tenant-ui

# Move into app directory
WORKDIR /app/apps/tenant-ui

# Install dependencies (monorepo-safe)
RUN npm install --legacy-peer-deps

# Build app
RUN npm run build

# ------------------------------------------------------------
# Stage 2: Serve with nginx
# ------------------------------------------------------------
FROM nginx:1.27-alpine

# Copy build output
COPY --from=builder /app/apps/tenant-ui/dist /usr/share/nginx/html

# Copy your NGINX config (optional, if mounted by K8s you can skip this)
COPY /apps/platform-ui/k8s/homepage/nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
