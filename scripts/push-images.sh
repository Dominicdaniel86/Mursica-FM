#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Build the Docker Compose containers
echo "Building Docker Compose containers..."
docker compose build

# Push the Docker Compose containers
echo "Pushing Docker Compose containers..."
docker compose push

# Tag the built images with ":latest" and push them
echo "Tagging and pushing images with ':latest' tag..."

compose_file="docker-compose.yaml"

echo "Images and tags from $compose_file:"
grep "image:" "$compose_file" | awk '{print $2}' | while read -r image; do
    name=$(echo "$image" | cut -d':' -f1)
    full_name=$name:latest
    echo "Tagging $image as $full_name"
    docker tag "$image" "$full_name"
    echo "Pushing $full_name"
    docker push "$full_name"
done


echo "Containers built and pushed successfully."