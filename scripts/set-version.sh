#!/bin/bash

# Print the version passed as an argument
if [ -z "$1" ]; then
    echo "No version provided."
    exit 1
fi

# File paths to be updated
PACKAGE_JSON_BACKEND="backend/package.json"
PACKAGE_JSON_FRONTEND="frontend/package.json"
PACKAGE_LOCK_JSON_BACKEND="backend/package-lock.json"
PACKAGE_LOCK_JSON_FRONTEND="frontend/package-lock.json"
DOCKER_COMPOSE_FILE="docker-compose.yaml"
CHANGELOG_FILE="CHANGELOG.md"

# Check if backend package.json exists
if [ ! -f "$PACKAGE_JSON_BACKEND" ]; then
    echo "Error: package.json not found at $PACKAGE_JSON_BACKEND"
    exit 1
fi
# Check if frontend package.json exists
if [ ! -f "$PACKAGE_JSON_FRONTEND" ]; then
    echo "Error: package.json not found at $PACKAGE_JSON_FRONTEND"
    exit 1
fi
# Check if backend package-lock.json exists
if [ ! -f "$PACKAGE_LOCK_JSON_BACKEND" ]; then
    echo "Error: package-lock.json not found at $PACKAGE_LOCK_JSON_BACKEND"
    exit 1
fi
# Check if frontend package-lock.json exists
if [ ! -f "$PACKAGE_LOCK_JSON_FRONTEND" ]; then
    echo "Error: package-lock.json not found at $PACKAGE_LOCK_JSON_FRONTEND"
    exit 1
fi
# Check if docker-compose.yml exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "Error: docker-compose.yml not found at $DOCKER_COMPOSE_FILE"
    exit 1
fi

# # Update the version in package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$1\"/" "$PACKAGE_JSON_BACKEND"
sed -i "s/\"version\": \".*\"/\"version\": \"$1\"/" "$PACKAGE_JSON_FRONTEND"
# # Update the version in package-lock.json
sed -i "s/\"version\": \".*\"/\"version\": \"$1\"/" "$PACKAGE_LOCK_JSON_BACKEND"
sed -i "s/\"version\": \".*\"/\"version\": \"$1\"/" "$PACKAGE_LOCK_JSON_FRONTEND"
# # Update the version in docker-compose.yml
sed -i "s/\(image:.*mursica-fm-backend:\)[^ ]*/\1$1/" "$DOCKER_COMPOSE_FILE"
sed -i "s/\(image:.*mursica-fm-proxy:\)[^ ]*/\1$1/" "$DOCKER_COMPOSE_FILE"

echo "Updated the version entries in /backend/package.json, /frontend/package.json and docker-compose."
echo "Please update the CHANGELOG.md with the version number $1."
