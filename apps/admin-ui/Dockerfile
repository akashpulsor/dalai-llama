FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY shared ./shared
COPY apps/admin-ui ./apps/admin-ui
RUN pnpm install --ignore-scripts
WORKDIR /app/apps/admin-ui
RUN npx vite build

FROM nginx:alpine
COPY --from=builder /app/apps/admin-ui/dist /usr/share/nginx/html
COPY --from=builder /app/apps/admin-ui/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
