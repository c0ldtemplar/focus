#!/bin/bash
# deploy-focus.sh - Deployment script for Focus AI Studio on Raspberry Pi
# Usage: bash deploy-focus.sh [--prod]

set -e

ENV_FILE=".env.local"
COMPOSE_FILE="docker-compose.yml"
REMOTE_USER="coldtemplar"
REMOTE_HOST="192.168.4.7"
REMOTE_PATH="/home/coldtemplar/focus"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Parse arguments
PROD_MODE=false
for arg in "$@"; do
  case $arg in
    --prod)
      PROD_MODE=true
      shift
      ;;
    *)
      log_error "Unknown option: $arg"
      echo "Usage: $0 [--prod]"
      exit 1
      ;;
  esac
done

# Check prerequisites
log_info "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { log_error "docker is not installed"; exit 1; }
docker compose version >/dev/null 2>&1 || { log_error "docker compose is not available"; exit 1; }

# Validate environment
if [ ! -f "$ENV_FILE" ]; then
  log_warn "Environment file $ENV_FILE not found, creating from example..."
  if [ -f ".env.example" ]; then
    cp .env.example "$ENV_FILE"
    log_info "Created $ENV_FILE from .env.example"
    log_warn "Please edit $ENV_FILE and add your GEMINI_API_KEY"
  else
    log_error "No .env.example found!"
    exit 1
  fi
fi

# Build the application
log_info "Building the application..."
npm run build

# Run tests
log_info "Running type checks..."
npm run lint

# Load environment variables
set -a
source "$ENV_FILE"
set +a

if [ "$PROD_MODE" = true ]; then
  log_info "Production deployment to Raspberry Pi..."

  # Create remote directory
  log_info "Creating remote directory..."
  sshpass -p 'BB2024' ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

  # Build Docker image
  log_info "Building Docker image..."
  docker compose build
  
  # Deploy to Raspberry Pi
  log_info "Deploying to $REMOTE_HOST..."
   sshpass -p 'BB2024' scp -o StrictHostKeyChecking=no docker-compose.yml "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
   sshpass -p 'BB2024' scp -o StrictHostKeyChecking=no package-lock.json "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
   sshpass -p 'BB2024' scp -o StrictHostKeyChecking=no -r dist "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
   sshpass -p 'BB2024' scp -o StrictHostKeyChecking=no Dockerfile "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
   sshpass -p 'BB2024' scp -o StrictHostKeyChecking=no server.js "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
   sshpass -p 'BB2024' scp -o StrictHostKeyChecking=no nginx.conf "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
   sshpass -p 'BB2024' scp -o StrictHostKeyChecking=no "$ENV_FILE" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/.env.local"
  
  # Restart services on Raspberry Pi
  sshpass -p 'BB2024' ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "
    cd $REMOTE_PATH
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    echo 'Deployment complete!'
  "
  
  log_info "Production deployment complete!"
  log_info "Access the application at: http://$REMOTE_HOST:3002"
else
  log_info "Local deployment..."
  
  # Run locally with Docker Compose
  log_info "Starting local services..."
  docker compose up -d --build
  
  log_info "Local deployment complete!"
  log_info "Access the application at: http://localhost:3002"
fi

# Health check
log_info "Checking application health..."
sleep 5
if curl -sf http://localhost:3002/health > /dev/null; then
  log_info "Application is healthy!"
else
  log_warn "Application health check failed, check logs with: docker compose logs"
fi

log_info "Done!"
