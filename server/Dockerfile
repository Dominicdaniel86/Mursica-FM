# Build stage
FROM node:24-alpine3.20 AS builder
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend .
RUN npm run build

# COPY ssl /app/ssl

# Serve stage
FROM nginx:1.23.1-alpine AS server

# Copy compiled JS, config, static files
COPY --from=builder /app/dist/*.js /var/www/mursica-fm/assets/javascript/
# COPY --from=builder /app/ssl /var/www/spotify-session-app/ssl/
COPY ./server/nginx.conf /etc/nginx/conf.d/default.conf
# COPY ./frontend/public /var/www/spotify-session-app/assets/ #! Deprecated. Done through volumes now.

EXPOSE 80
