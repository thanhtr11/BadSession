#!/bin/bash

# Build and push Docker images to Docker Hub
# Usage: ./build-and-push.sh <docker-username>

DOCKER_USERNAME=${1:-thanhtruongtien}
IMAGE_TAG="latest"

echo "Building and pushing images to Docker Hub..."
echo "Docker Username: $DOCKER_USERNAME"

# Build and push server image
echo "Building server image..."
docker build -t $DOCKER_USERNAME/badsession-server:$IMAGE_TAG ./server
docker push $DOCKER_USERNAME/badsession-server:$IMAGE_TAG

# Build and push web image
echo "Building web image..."
docker build -t $DOCKER_USERNAME/badsession-web:$IMAGE_TAG ./web
docker push $DOCKER_USERNAME/badsession-web:$IMAGE_TAG

echo "Done! Images pushed to Docker Hub:"
echo "- $DOCKER_USERNAME/badsession-server:$IMAGE_TAG"
echo "- $DOCKER_USERNAME/badsession-web:$IMAGE_TAG"
