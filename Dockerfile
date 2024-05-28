FROM node:21

WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=19006
ENV PORT $PORT
EXPOSE $PORT 19001 19002

ENV NPM_PREFIX=/root/node/.npm-global
ENV PATH $NPM_PREFIX/bin:$PATH

RUN npm i --unsafe-perm -g npm@latest expo-cli@latest @expo/webpack-config@latest @expo/webpack-config@^19.0.0

COPY package*.json ./dalai-llama/

WORKDIR /app/dalai-llama

RUN npm install

COPY . ./*

CMD ["npm", "run","web"]