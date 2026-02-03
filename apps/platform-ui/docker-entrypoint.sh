#!/bin/sh
sed -i "s|__KEYCLOAK_URL__|${KEYCLOAK_URL:-http://auth.localhost:8081}|g" /usr/share/nginx/html/env-config.js
sed -i "s|__KEYCLOAK_REALM__|${KEYCLOAK_REALM:-dalai-llama}|g" /usr/share/nginx/html/env-config.js
sed -i "s|__KEYCLOAK_CLIENT_ID__|${KEYCLOAK_CLIENT_ID:-platform-ui}|g" /usr/share/nginx/html/env-config.js
sed -i "s|__PLATFORM_URL__|${PLATFORM_URL:-http://platform.localhost:8081}|g" /usr/share/nginx/html/env-config.js
sed -i "s|__DASHBOARD_APP_URL__|${DASHBOARD_APP_URL:-http://dashboard.localhost:8081}|g" /usr/share/nginx/html/env-config.js
sed -i "s|__API_BASE_URL__|${API_BASE_URL:-https://api.dalaillama-dev.local:8443/api/v1}|g" /usr/share/nginx/html/env-config.js
exec "$@"