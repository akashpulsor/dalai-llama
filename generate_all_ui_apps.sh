#!/bin/bash
set -e

echo "🚀 Generating Dalai Llama UI app folders..."

APPS=("platform-ui" "dashboard-ui" "agents-ui")

for APP_NAME in "${APPS[@]}"; do
  APP_DIR="apps/$APP_NAME"
  K8S_DIR="$APP_DIR/k8s"

  if [ -d "$APP_DIR" ]; then
    echo "⚠️  Skipping existing app: $APP_NAME"
    continue
  fi

  echo "📦 Creating $APP_NAME ..."
  mkdir -p "$APP_DIR/src/pages" "$APP_DIR/src/components" "$K8S_DIR"

  # --- Basic package.json ---
  cat > "$APP_DIR/package.json" <<EOF
{
  "name": "$APP_NAME",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1",
    "@dalaillama/shared-config": "1.0.0",
    "@dalaillama/shared-store": "1.0.0",
    "@dalaillama/shared-ui": "1.0.0",
    "@dalaillama/shared-hooks": "1.0.0",
    "@dalaillama/shared-utils": "1.0.0",
    "lucide-react": "^0.452.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "vite": "^5.4.8"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "npx serve dist -l 5173"
  }
}
EOF

  # --- index.html ---
  cat > "$APP_DIR/index.html" <<EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${APP_NAME^} - Dalai Llama</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

  # --- Tailwind + PostCSS ---
  cat > "$APP_DIR/tailwind.config.js" <<'EOF'
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: []
};
EOF

  cat > "$APP_DIR/postcss.config.js" <<'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
EOF

  # --- Vite config ---
  cat > "$APP_DIR/vite.config.js" <<'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 }
});
EOF

  # --- Source files ---
  cat > "$APP_DIR/src/index.css" <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

  cat > "$APP_DIR/src/main.jsx" <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
EOF

  cat > "$APP_DIR/src/App.jsx" <<EOF
import React from "react";
export default function App(){
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-purple-700 text-2xl font-bold">
      🦙 ${APP_NAME^} UI Ready
      <p className="text-base text-gray-600 mt-2">Add your pages in src/pages/</p>
    </div>
  );
}
EOF

  # --- K8S Manifests ---
  cat > "$K8S_DIR/configmap.yaml" <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${APP_NAME}-config
  labels:
    app: ${APP_NAME}
data:
  APP_NAME: "${APP_NAME}"
  PROM_PUSH_URL: "https://prom.dalaillama.in/api/v1/push"
  API_BASE_URL: "https://api.dalaillama.in"
EOF

  cat > "$K8S_DIR/deployment.yaml" <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${APP_NAME}-deployment
  labels:
    app: ${APP_NAME}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${APP_NAME}
  template:
    metadata:
      labels:
        app: ${APP_NAME}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/health"
        prometheus.io/port: "80"
    spec:
      containers:
      - name: ${APP_NAME}
        image: dalaillama/${APP_NAME}:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 80
        envFrom:
        - configMapRef:
            name: ${APP_NAME}-config
EOF

  cat > "$K8S_DIR/service.yaml" <<EOF
apiVersion: v1
kind: Service
metadata:
  name: ${APP_NAME}-svc
  labels:
    app: ${APP_NAME}
spec:
  selector:
    app: ${APP_NAME}
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
EOF

  cat > "$K8S_DIR/ingress.yaml" <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${APP_NAME}-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  rules:
  - host: ${APP_NAME}.dalaillama.in
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${APP_NAME}-svc
            port:
              number: 80
  tls:
  - hosts:
    - ${APP_NAME}.dalaillama.in
    secretName: ${APP_NAME}-tls
EOF

  # --- Dockerfile ---
  cat > "$APP_DIR/Dockerfile" <<EOF
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./k8s/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

  # --- Nginx conf ---
  cat > "$K8S_DIR/nginx.conf" <<'EOF'
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /health {
    add_header Content-Type text/plain;
    return 200 'ok';
  }
}
EOF

  echo "✅ Created: $APP_DIR"
done

echo
echo "🎉 All UI apps generated!"
tree apps -L 2 || ls apps
