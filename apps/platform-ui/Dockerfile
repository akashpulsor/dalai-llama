# apps/platform-ui/Dockerfile

# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Install deps (no lock file available)
RUN npm install

COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine
# only copy static build; nginx.conf will come from infra repo
COPY --from=builder /app/dist /usr/share/nginx/html
# default nginx.conf will be mounted later via ConfigMap
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
