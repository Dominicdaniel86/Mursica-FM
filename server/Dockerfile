# Build stage
FROM node:16-alpine as builder
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build

# Serve stage
FROM nginx:1.23.1-alpine as server

# Copy compiled JS, config, static files
COPY --from=builder /app/dist/*.js /var/www/spotify-session-app/assets/javascript/
COPY ./server/nginx.conf /etc/nginx/conf.d/default.conf
# COPY ./frontend/public /var/www/spotify-session-app/assets/ #! Deprecated. Done through volumes now.

EXPOSE 80
