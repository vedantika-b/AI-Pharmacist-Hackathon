# Production Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] Set `ENVIRONMENT=production` in .env
- [ ] Disable `DEBUG=False`
- [ ] Generate secure `SECRET_KEY` (32+ random characters)
- [ ] Configure specific `ALLOWED_HOSTS` (remove wildcards)
- [ ] Review and restrict `CORS_ORIGINS`
- [ ] Enable rate limiting (`RATE_LIMIT_ENABLED=True`)
- [ ] Configure Sentry DSN for error tracking
- [ ] Rotate all API keys and tokens
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules

### Performance
- [ ] Set appropriate `WORKERS` count (2× CPU cores)
- [ ] Configure `DB_POOL_SIZE` based on expected load
- [ ] Test with realistic load (use k6, locust, or apache bench)
- [ ] Enable connection pooling
- [ ] Configure caching strategy (Redis recommended)
- [ ] Optimize database queries

### Monitoring
- [ ] Configure structured logging (`LOG_FORMAT=json`)
- [ ] Set up log aggregation (ELK, Datadog, CloudWatch)
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring
- [ ] Configure alerting (PagerDuty, OpsGenie, Slack)
- [ ] Create monitoring dashboards

### Database
- [ ] Verify Supabase production tier
- [ ] Configure backup strategy
- [ ] Set up database replication
- [ ] Test disaster recovery procedures
- [ ] Configure connection timeout and retry logic
- [ ] Optimize indexes

### Dependencies
- [ ] Pin all dependency versions
- [ ] Scan for vulnerabilities (`pip-audit`)
- [ ] Keep dependencies up to date
- [ ] Review license compliance

## Deployment Strategies

### 1. Docker Deployment

**Dockerfile**
```dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

RUN pip install --no-cache /wheels/*

COPY . .

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**Build & Run**
```bash
docker build -t ai-pharmacist-api:latest .
docker run -p 8000:8000 --env-file .env ai-pharmacist-api:latest
```

### 2. Docker Compose

**docker-compose.yml**
```yaml
version: '3.8'

services:
  api:
    build: .
    image: ai-pharmacist-api:latest
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - api
    restart: unless-stopped
```

**nginx.conf**
```nginx
upstream api_backend {
    least_conn;
    server api:8000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }
}
```

### 3. Kubernetes

**deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-pharmacist-api
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ai-pharmacist-api
  template:
    metadata:
      labels:
        app: ai-pharmacist-api
        version: v1.0.0
    spec:
      containers:
      - name: api
        image: your-registry.io/ai-pharmacist-api:v1.0.0
        ports:
        - containerPort: 8000
          name: http
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: WORKERS
          value: "4"
        envFrom:
        - secretRef:
            name: api-secrets
        livenessProbe:
          httpGet:
            path: /health/liveness
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 3
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
---
apiVersion: v1
kind: Service
metadata:
  name: ai-pharmacist-api
  namespace: production
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
    name: http
  selector:
    app: ai-pharmacist-api
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-pharmacist-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-pharmacist-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 4. Cloud Platform Specifics

#### AWS (ECS/Fargate)

**task-definition.json**
```json
{
  "family": "ai-pharmacist-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "your-registry/ai-pharmacist-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"}
      ],
      "secrets": [
        {"name": "GROQ_API_KEY", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "SUPABASE_SERVICE_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-pharmacist-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**Deploy Command**
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs update-service --cluster prod --service api --task-definition ai-pharmacist-api
```

#### GCP (Cloud Run)

```bash
gcloud run deploy ai-pharmacist-api \
  --image gcr.io/PROJECT_ID/ai-pharmacist-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production \
  --set-secrets GROQ_API_KEY=groq-key:latest, \
    SUPABASE_SERVICE_KEY=supabase-key:latest \
  --cpu 2 \
  --memory 1Gi \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 60
```

#### Azure (Container Instances / App Service)

```bash
az container create \
  --resource-group rg-ai-pharmacist \
  --name ai-pharmacist-api \
  --image your-registry.azurecr.io/ai-pharmacist-api:latest \
  --cpu 2 \
  --memory 4 \
  --ports 8000 \
  --environment-variables ENVIRONMENT=production \
  --secure-environment-variables \
    GROQ_API_KEY=$GROQ_KEY \
    SUPABASE_SERVICE_KEY=$ SUPABASE_KEY \
  --dns-name-label ai-pharmacist-api
```

## CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest --cov
      - run: ruff check .
      - run: mypy .

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/ai-pharmacist-api \
            api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          kubectl rollout status deployment/ai-pharmacist-api
```

## Post-Deployment

### Verification

```bash
# Health check
curl https://api.example.com/health

# Detailed status
curl https://api.example.com/health/detailed

# Load test
ab -n 1000 -c 10 https://api.example.com/health
```

### Monitoring

- Check error rates in Sentry
- Review logs in aggregation platform
- Monitor resource usage
- Verify alerts are working
- Test rollback procedure

### Rollback

```bash
# Kubernetes
kubectl rollout undo deployment/ai-pharmacist-api

# Docker Compose
docker-compose down
docker-compose up -d --build

# Cloud Run
gcloud run services update-traffic ai-pharmacist-api \
  --to-revisions PREVIOUS_REVISION=100
```

## Maintenance

### Regular Tasks

- Weekly dependency updates
- Monthly security audit
- Quarterly disaster recovery test
- Review and rotate API keys
- Database maintenance (vacuum, analyze)
- Log rotation and cleanup

### Performance Tuning

- Monitor slow queries
- Optimize database indexes
- Tune connection pool sizes
- Review and adjust rate limits
- Cache frequently accessed data

## Troubleshooting

### High Memory Usage
- Check for memory leaks
- Review connection pool settings
- Monitor ML model loading

### Slow Response Times
- Check database query performance
- Review external service latency
- Increase workers if CPU-bound

### Connection Errors
- Verify network/firewall rules
- Check database connection limits
- Review timeout settings
