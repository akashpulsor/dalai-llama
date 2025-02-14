# Use a Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy the rest of the app
COPY . .

# Debug: Check Expo versions and configuration
RUN echo "Node version: $(node -v)" && \
    echo "NPM version: $(npm -v)" && \
    echo "Installed packages:" && \
    npm list --depth=0 | grep expo

# Use Expo version from package.json to determine the correct build command
RUN if grep -q "\"expo\":" package.json; then \
      EXPO_VERSION=$(node -e "console.log(require('./package.json').dependencies.expo || '')"); \
      echo "Detected Expo version: $EXPO_VERSION"; \
      if [ -z "$EXPO_VERSION" ]; then \
        echo "Expo version not found in dependencies, checking devDependencies..."; \
        EXPO_VERSION=$(node -e "console.log(require('./package.json').devDependencies.expo || '')"); \
        echo "Detected Expo version from devDependencies: $EXPO_VERSION"; \
      fi; \
      if [[ "$EXPO_VERSION" == "~"* ]] || [[ "$EXPO_VERSION" == "^"* ]]; then \
        EXPO_VERSION=${EXPO_VERSION:1}; \
      fi; \
      MAJOR_VERSION=$(echo $EXPO_VERSION | cut -d. -f1); \
      echo "Major Expo version: $MAJOR_VERSION"; \
      if [ "$MAJOR_VERSION" -ge "46" ]; then \
        echo "Using newer Expo CLI commands"; \
        npx expo install expo-cli && \
        npx expo export:web || npx expo build:web; \
      else \
        echo "Using legacy Expo CLI commands"; \
        npm install -g expo-cli@6.0.8 && \
        expo build:web; \
      fi; \
    else \
      echo "Expo not found in package.json, attempting legacy build"; \
      npm install -g expo-cli@6.0.8 && \
      expo build:web; \
    fi

# Verify web-build directory exists
RUN if [ ! -d "web-build" ]; then \
      echo "Error: web-build directory was not created. Build failed."; \
      exit 1; \
    else \
      echo "web-build directory successfully created"; \
    fi

# Install a simple HTTP server to serve the static files
RUN npm install -g serve

# Expose the port Expo uses
EXPOSE 19006

# Command to start the server
CMD ["serve", "-s", "web-build", "-l", "19006"]
