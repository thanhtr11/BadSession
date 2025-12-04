param(
  [string]$DockerUsername = 'thanhtr',
  [string]$ImageTag = 'latest'
)

Write-Output "Building and pushing Docker images for user: $DockerUsername"

# Platforms to build for
$platforms = 'linux/amd64,linux/arm64'

Write-Output "Platforms: $platforms"

Write-Output "Building server image..."
docker buildx build --platform $platforms -f .\server\Dockerfile.prod -t $DockerUsername/badsession-server:$ImageTag --push .\server

Write-Output "Building web image..."
docker buildx build --platform $platforms -f .\web\Dockerfile.prod -t $DockerUsername/badsession-web:$ImageTag --push .\web

Write-Output "Done. Pushed images:"
Write-Output "- $DockerUsername/badsession-server:$ImageTag"
Write-Output "- $DockerUsername/badsession-web:$ImageTag"
