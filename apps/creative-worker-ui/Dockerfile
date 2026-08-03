FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared ./shared
COPY apps ./apps

RUN pnpm install --no-frozen-lockfile

WORKDIR /app/apps/creative-worker-ui
RUN pnpm build

FROM nginx:1.27-alpine

COPY --from=builder /app/apps/creative-worker-ui/dist /usr/share/nginx/html
COPY apps/creative-worker-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
