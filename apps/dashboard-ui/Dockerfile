FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY shared ./shared
COPY apps/dashboard-ui ./apps/dashboard-ui

RUN pnpm install --ignore-scripts

WORKDIR /app/apps/dashboard-ui
RUN npx vite build

FROM nginx:alpine
COPY --from=builder /app/apps/dashboard-ui/dist /usr/share/nginx/html
COPY --from=builder /app/apps/dashboard-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/dashboard-ui/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]