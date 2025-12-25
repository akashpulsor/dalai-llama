FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY shared ./shared
COPY apps/platform-ui ./apps/platform-ui

RUN pnpm install --ignore-scripts

WORKDIR /app/apps/platform-ui
RUN npx vite build

FROM nginx:alpine
COPY --from=builder /app/apps/platform-ui/dist /usr/share/nginx/html
COPY --from=builder /app/apps/platform-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/platform-ui/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]