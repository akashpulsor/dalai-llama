FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY apps/admin-dashboard-ui ./apps/admin-dashboard-ui
WORKDIR /app/apps/admin-dashboard-ui
RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/apps/admin-dashboard-ui/dist /usr/share/nginx/html
COPY /apps/admin-dashboard-ui/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1
CMD ["nginx","-g","daemon off;"]
