# 🚀 NutrifyAI Deployment Guide

This guide will help you deploy NutrifyAI to production.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Create a `.env` file in the `docker/` directory with the following variables:

```env
# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=sk-your-actual-api-key-here

# Database Configuration
MONGO_URL=mongodb://mongo:27017
MONGO_DB=fitapp

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# S3/MinIO Configuration
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=uploads

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=*

# Application Environment
APP_ENV=production
```

### 2. Security Configuration

**IMPORTANT:** Before deploying to production:

1. **Generate a strong JWT secret:**
   ```bash
   openssl rand -hex 32
   ```
   Use this value for `JWT_SECRET_KEY`

2. **Configure CORS properly:**
   Replace `ALLOWED_ORIGINS=*` with your actual domain:
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

3. **Secure MinIO credentials:**
   Change `S3_ACCESS_KEY` and `S3_SECRET_KEY` to strong, unique values

4. **Use HTTPS:**
   Set up SSL/TLS certificates for your domain

## 🐳 Docker Deployment

### Option 1: Docker Compose (Recommended for VPS)

1. **Prepare the server:**
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt-get install docker-compose-plugin
   ```

2. **Clone the repository:**
   ```bash
   git clone https://github.com/ofarooq21/AI-Fitness-Tracker.git
   cd AI-Fitness-Tracker
   ```

3. **Configure environment:**
   ```bash
   cd docker
   nano .env  # Add your configuration
   ```

4. **Start services:**
   ```bash
   docker-compose up -d --build
   ```

5. **Verify deployment:**
   ```bash
   docker-compose ps
   docker-compose logs -f api
   ```

6. **Access the application:**
   - API: http://your-server-ip:8000
   - Health Check: http://your-server-ip:8000/health/health

### Option 2: Individual Docker Containers

```bash
# Build and run API
docker build -t nutrify-api -f docker/Dockerfile.api .
docker run -d -p 8000:8000 --env-file docker/.env nutrify-api

# Run MongoDB
docker run -d -p 27017:27017 --name mongo mongo:7

# Run Redis
docker run -d -p 6379:6379 --name redis redis:7

# Run MinIO
docker run -d -p 9000:9000 -p 9001:9001 --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure environment variables in Vercel dashboard:**
   - `EXPO_PUBLIC_API_URL=https://your-api-domain.com`

### Option 2: Netlify

1. **Build the app:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=web-build
   ```

### Option 3: Static Hosting (AWS S3, Azure, etc.)

1. **Build for production:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload the `web-build/` directory to your hosting service**

## 🔒 SSL/TLS Configuration

### Using Nginx as Reverse Proxy

1. **Install Nginx:**
   ```bash
   sudo apt-get install nginx
   ```

2. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8081;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /api {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Install SSL with Let's Encrypt:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## 📊 Monitoring & Maintenance

### Health Checks

Monitor these endpoints:
- `GET /health/health` - Basic health check
- `GET /health/detailed` - Detailed system status

### Logs

View application logs:
```bash
# Docker Compose
docker-compose logs -f api
docker-compose logs -f worker

# Individual containers
docker logs -f nutrify-api
```

### Database Backups

Backup MongoDB:
```bash
# Create backup
docker-compose exec mongo mongodump --out /backup

# Restore backup
docker-compose exec mongo mongorestore /backup
```

### Updates

Update the application:
```bash
git pull origin main
cd docker
docker-compose down
docker-compose up -d --build
```

## 🔧 Troubleshooting

### API Not Starting

1. Check logs:
   ```bash
   docker-compose logs api
   ```

2. Verify environment variables:
   ```bash
   docker-compose exec api env | grep OPENAI
   ```

3. Check database connection:
   ```bash
   docker-compose exec api curl http://localhost:8000/health/detailed
   ```

### Frontend Not Connecting to API

1. Check CORS configuration in backend `.env`
2. Verify API URL in frontend configuration
3. Check network connectivity between services

### Database Issues

1. Check MongoDB is running:
   ```bash
   docker-compose ps mongo
   ```

2. Verify connection:
   ```bash
   docker-compose exec mongo mongosh
   ```

3. Check disk space:
   ```bash
   df -h
   ```

## 🎯 Performance Optimization

### Backend

1. **Enable caching:**
   - Redis is already configured for caching
   - Implement cache warming for frequently accessed data

2. **Database indexing:**
   - Indexes are automatically created on startup
   - Monitor slow queries and add indexes as needed

3. **Connection pooling:**
   - MongoDB connection pooling is enabled by default
   - Adjust pool size in production if needed

### Frontend

1. **Code splitting:**
   - Already implemented with React lazy loading

2. **Image optimization:**
   - Compress images before upload
   - Use WebP format where possible

3. **CDN:**
   - Serve static assets from a CDN
   - Enable browser caching

## 📈 Scaling

### Horizontal Scaling

1. **Load Balancer:**
   ```nginx
   upstream api_backend {
       server api1:8000;
       server api2:8000;
       server api3:8000;
   }
   ```

2. **Database Replication:**
   - Set up MongoDB replica set
   - Configure read replicas for scaling reads

3. **Redis Cluster:**
   - Set up Redis cluster for high availability
   - Use Redis Sentinel for automatic failover

### Vertical Scaling

Adjust Docker resource limits:
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 🆘 Support

For deployment issues:
1. Check the logs first
2. Review this deployment guide
3. Check the main README.md
4. Open an issue on GitHub

---

**Remember:** Always test in a staging environment before deploying to production!

