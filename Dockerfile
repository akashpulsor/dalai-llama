FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Install Expo CLI
RUN npm install -g expo-cli

# Copy the rest of the app
COPY . .

# Install Expo dependencies and build the web version
RUN npx expo install
RUN npx expo export:web

# Set up a simple web server to serve the static files
RUN npm install -g serve

# Expose the port
EXPOSE 8080

# Command to run the app
CMD ["serve", "-s", "web-build", "-l", "8080"]