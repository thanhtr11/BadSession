#!/bin/bash

# Build and push Docker images to Docker Hub with multi-platform support
# Usage: ./build-and-push.sh <docker-username>

DOCKER_USERNAME=${1:-thanhtr}
IMAGE_TAG="latest"
PLATFORMS="linux/amd64,linux/arm64"

echo "Building and pushing images to Docker Hub..."
echo "Docker Username: $DOCKER_USERNAME"
echo "Platforms: $PLATFORMS"

# Build and push server image
echo ""
echo "Building server image..."
docker buildx build --platform $PLATFORMS -f ./server/Dockerfile.prod -t $DOCKER_USERNAME/badsession-server:$IMAGE_TAG --push ./server

# Build and push web image
echo ""
echo "Building web image..."
docker buildx build --platform $PLATFORMS -f ./web/Dockerfile.prod -t $DOCKER_USERNAME/badsession-web:$IMAGE_TAG --push ./web

echo ""
echo "Done! Images pushed to Docker Hub:"
echo "- $DOCKER_USERNAME/badsession-server:$IMAGE_TAG"
echo "- $DOCKER_USERNAME/badsession-web:$IMAGE_TAG"
echo ""
echo "To use in production:"
echo "docker-compose -f docker-compose.prod.yml up -d"
