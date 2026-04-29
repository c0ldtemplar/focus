# Deployment Guide for Focus AI Studio on Raspberry Pi

## Infrastructure Overview

The Raspberry Pi runs a Docker-based infrastructure with:
- **Network**: `rocalian-net` (172.20.0.0/16) - shared network for all containers
- **Reverse Proxy**: Nginx Proxy Manager (NPM) on ports 80/443
- **Container Registry**: localhost:5000 (internal Docker registry)

## Deployment Steps

### Option 1: Direct Docker Deployment (Quick)

```bash
# On local machine - build and push to local registry
cd /home/rober/proyectos2026/Focus

# Build the production bundle
npm run build

# Create container on Raspberry Pi via SSH
ssh coldtemplar@192.168.4.7

# On Raspberry Pi:
cd /opt/tea-connect/focus

# Create Dockerfile
cat > Dockerfile << 'DOCKERFILE'
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY dist ./dist
COPY server.js ./
COPY .env.example ./.env.local

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1))"

CMD ["node", "server.js"]
DOCKERFILE

# Create docker-compose.yml
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  focus:
    build: .
    container_name: focus-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - focus-data:/app/data
    networks:
      - rocalian-net
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

volumes:
  focus-data:

networks:
  rocalian-net:
    external: true
COMPOSE

# Create .env file
cat > .env << 'ENV'
GEMINI_API_KEY=your_api_key_here
ENV

# Build and start
docker compose build
docker compose up -d

# Verify
docker compose ps
docker compose logs -f
```

### Option 2: Using Nginx Proxy Manager

After deploying the container, add a proxy host in NPM:

1. Access NPM: http://npm.rocalian.cl (admin:admin initially)
2. Go to "Proxy Hosts" → "Add Proxy Host"
3. Configure:
   - Domain: focus.rocalian.cl
   - Scheme: http
   - Forward Hostname/IP: focus-app
   - Forward Port: 3000
   - SSL: Request new certificate (Let's Encrypt)
   - Block Common Exploits: Yes
   - HTTP/2: Yes
4. Save and enable

### Option 3: Deploy via Jenkins Pipeline

The infrastructure has Jenkins at http://jenkins.rocalian.cl for CI/CD.

Create a Jenkinsfile in the Focus repo:

```groovy
pipeline {
    agent { label 'raspberry-pi' }
    
    environment {
        REGISTRY = 'localhost:5000'
        APP_NAME = 'focus'
        DOCKERFILE = 'Dockerfile'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm run lint'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${REGISTRY}/${APP_NAME}:latest ."
            }
        }
        
        stage('Push to Registry') {
            steps {
                sh "docker push ${REGISTRY}/${APP_NAME}:latest"
            }
        }
        
        stage('Deploy') {
            steps {
                sh """
                    docker compose -f /opt/tea-connect/focus/docker-compose.yml pull
                    docker compose -f /opt/tea-connect/focus/docker-compose.yml up -d
                """
            }
        }
        
        stage('Health Check') {
            steps {
                sh 'curl -f http://localhost:3002/health || exit 1'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            slackSend channel: '#alerts', message: "Focus deployment failed: ${env.BUILD_URL}"
        }
    }
}
```

## Local Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run lint

# Local production server
npm start
```

## Docker Deployment

```bash
# Build locally
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild and restart
docker compose up -d --build
```

## Health Monitoring

The application exposes health check endpoints:

- **HTTP**: http://localhost:3000/health
- **Docker**: Built into the container
- **NPM**: Configure health checks in NPM proxy host

## Troubleshooting

### Container won't start
```bash
docker compose logs focus
docker compose ps
```

### Port conflicts
The app uses port 3000 internally and 3002 externally. Check for conflicts:
```bash
sudo lsof -i :3000
sudo lsof -i :3002
```

### Memory issues
Increase memory limit in docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      memory: 2G
```

### SSL certificate issues
Ensure NPM can reach Let's Encrypt:
```bash
docker compose exec nginx nginx -t
docker compose restart nginx
```

## Network Architecture

```
Internet
  ↓
Cloudflare (DNS + WAF)
  ↓
Cloudflare Tunnel (rocalian-cloudflared)
  ↓
Nginx Proxy Manager (172.20.0.2)
  ↓
Docker Network (rocalian-net)
  ├─ focus-app (172.20.0.x:3000)
  ├─ tea-connect-app (172.20.0.x:3334)
  ├─ nginx-proxy-manager
  └─ other containers...
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `NODE_ENV` | No | `production` | Node environment |
| `PORT` | No | `3000` | Server port |

## Files Structure

```
.
├── src/
│   ├── App.tsx              # Main application
│   ├── components/          # React components
│   ├── services/            # API services
│   ├── types.ts             # TypeScript types
│   └── constants.ts         # App constants
├── dist/                    # Production build
├── server.js                # Express production server
├── Dockerfile               # Container image
├── docker-compose.yml       # Container orchestration
├── nginx.conf               # Nginx configuration
└── deploy.sh                # Deployment script
```

## Backup and Maintenance

The Focus app doesn't require database backups (stateless), but consider:

1. **Source code**: Already in git repository
2. **Docker images**: Stored in local registry
3. **Build artifacts**: Can be rebuilt from source

## Security Considerations

1. **API Keys**: Store in `.env` file, never in git
2. **Container Updates**: Regularly update base images
3. **Network Isolation**: Uses dedicated network segment
4. **Health Checks**: Automated restart on failure
5. **Memory Limits**: Prevent resource exhaustion
6. **Non-root User**: Runs as unprivileged user

## Performance Optimization

- Static assets served with long cache TTL (1 year)
- Gzip compression via Nginx
- React code splitting via dynamic imports
- Docker layer caching for fast rebuilds
- Health checks for automated recovery

