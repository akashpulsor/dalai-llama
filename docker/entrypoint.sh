#!/bin/sh
# Runtime environment injection for Vite SPA apps.
# Injects env vars as window.__ENV__ into index.html so the app can
# read them at runtime without rebuilding the Docker image.

set -e

INDEX_FILE="/usr/share/nginx/html/index.html"
GA_ID="${GA_MEASUREMENT_ID:-${GOOGLE_ANALYTICS_MEASUREMENT_ID:-}}"

# Build the JSON object (single line, no newlines)
RUNTIME_ENV_JSON="{\"API_BASE_URL\":\"${API_BASE_URL:-}\",\"KEYCLOAK_URL\":\"${KEYCLOAK_URL:-}\",\"KEYCLOAK_REALM\":\"${KEYCLOAK_REALM:-}\",\"KEYCLOAK_CLIENT_ID\":\"${KEYCLOAK_CLIENT_ID:-}\",\"KEYCLOAK_SERVER_URL\":\"${KEYCLOAK_SERVER_URL:-}\",\"KEYCLOAK_PROFILE\":\"${KEYCLOAK_PROFILE:-}\",\"PLATFORM_URL\":\"${PLATFORM_URL:-}\",\"DASHBOARD_APP_URL\":\"${DASHBOARD_APP_URL:-}\",\"CREATOR_APP_URL\":\"${CREATOR_APP_URL:-}\",\"WS_STT_URL\":\"${WS_STT_URL:-}\",\"GA_MEASUREMENT_ID\":\"${GA_ID:-}\"}"

# Build the script tag to inject
SCRIPT_TAG="<script>window.__ENV__=${RUNTIME_ENV_JSON};<\/script>"

# If there's a legacy __RUNTIME_ENV__ placeholder, replace it
if grep -q "__RUNTIME_ENV__" "$INDEX_FILE" 2>/dev/null; then
  sed -i "s|__RUNTIME_ENV__|${RUNTIME_ENV_JSON}|g" "$INDEX_FILE"
fi

# If window.__ENV__ is not already present, inject the script before </head>
if ! grep -q "window.__ENV__" "$INDEX_FILE" 2>/dev/null; then
  sed -i "s|</head>|${SCRIPT_TAG}</head>|" "$INDEX_FILE"
fi

# Start nginx
exec nginx -g 'daemon off;'
