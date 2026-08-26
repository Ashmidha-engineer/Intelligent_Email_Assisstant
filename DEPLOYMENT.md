# 🚀 Deployment Guide - Intelligent Email Assistant

## Quick Start with Docker

### Local Development with Docker Compose

```bash
# 1. Clone the repository
git clone https://github.com/Ashmidha-engineer/Intelligent_Email_Assisstant.git
cd Intelligent_Email_Assisstant

# 2. Create .env file with your configuration
cp backend/.env.example .env

# 3. Start all services (PostgreSQL, Redis, App)
docker-compose up -d

# 4. Run database migrations
docker-compose exec app npm run db:push

# 5. Seed sample data (optional)
docker-compose exec app npm run db:seed

# 6. Access the application
# Frontend: http://localhost:5002
# Backend API: http://localhost:5002/api
# Health Check: http://localhost:5002/api/health
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

### Stop Services

```bash
docker-compose down

# Remove volumes (clean database)
docker-compose down -v
```

---

## Production Deployment

### Option 1: Deploy to Railway.app (Recommended - Easiest)

**Why Railway?**
- Auto-detects Dockerfile
- Includes PostgreSQL plugin
- Automatic HTTPS
- GitHub integration
- Free tier available

**Steps:**

1. **Sign up** at [railway.app](https://railway.app) with GitHub
2. **Create New Project** → Select "Deploy from GitHub repo"
3. **Connect** your `Intelligent_Email_Assisstant` repository
4. **Add Services:**
   - PostgreSQL (click + icon, add plugin)
   - App (auto-detected from Dockerfile)
5. **Configure Environment Variables**:
   ```
   PORT=5002
   NODE_ENV=production
   FRONTEND_URL=https://your-railway-app.up.railway.app
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   
   JWT_SECRET=your-secure-random-key-here
   TOKEN_ENCRYPTION_KEY=your-secure-32-char-hex-key-here
   
   GOOGLE_CLIENT_ID=your-google-oauth-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-secret
   GOOGLE_REDIRECT_URI=https://your-railway-app.up.railway.app/api/auth/google/callback
   
   ANTHROPIC_API_KEY=optional
   OPENAI_API_KEY=optional
   GEMINI_API_KEY=optional
   ```
6. **Deploy** → Railway automatically deploys on git push

---

### Option 2: Deploy to Render.com

**Steps:**

1. **Sign up** at [render.com](https://render.com) with GitHub
2. **Create New → Web Service**
3. **Connect** GitHub repository
4. **Configure:**
   - Name: `intelligent-email-assistant`
   - Environment: `Docker`
   - Region: Select closest to your users
   - Instance Type: `Free` (or `Paid` for production)
5. **Add PostgreSQL Database**:
   - Create New → PostgreSQL
   - Copy connection string
6. **Set Environment Variables** (same as Railway)
7. **Deploy**

---

### Option 3: Deploy to AWS (ECS/Fargate)

**Prerequisites:**
- AWS Account
- AWS CLI configured
- Docker image pushed to ECR

**Steps:**

```bash
# 1. Build and push Docker image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t intelligent-email-assistant .

docker tag intelligent-email-assistant:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/intelligent-email-assistant:latest

docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/intelligent-email-assistant:latest

# 2. Create RDS PostgreSQL instance (AWS Console)

# 3. Create ElastiCache Redis (AWS Console)

# 4. Create ECS Cluster and Task Definition
# - Use pushed image URL
# - Set environment variables
# - Configure security groups

# 5. Launch Fargate service from task definition
```

---

### Option 4: Deploy to DigitalOcean (Docker Droplet)

**Steps:**

1. **Create Droplet**:
   - Select Ubuntu 22.04
   - Size: $4-6/month minimum
   - Add Docker one-click app
2. **SSH into droplet**:
   ```bash
   ssh root@your-droplet-ip
   ```
3. **Clone repository**:
   ```bash
   git clone https://github.com/Ashmidha-engineer/Intelligent_Email_Assisstant.git
   cd Intelligent_Email_Assisstant
   ```
4. **Create .env file**:
   ```bash
   nano .env
   # Add all environment variables
   ```
5. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```
6. **Set up reverse proxy with Nginx** (for HTTPS):
   ```bash
   apt update && apt install -y nginx certbot python3-certbot-nginx
   ```
7. **Configure Nginx** to proxy to port 5002
8. **Enable HTTPS**:
   ```bash
   certbot --nginx -d your-domain.com
   ```

---

## Environment Variables Reference

### Required
- `PORT` - Server port (default: 5002)
- `NODE_ENV` - `development` or `production`
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure random string (32+ chars)
- `TOKEN_ENCRYPTION_KEY` - 64-char hex string for AES-256-GCM

### Google OAuth (Optional for Demo Mode)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### AI Providers (Optional - Simulator runs by default)
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

### Optional
- `REDIS_URL` - Redis connection (auto uses local Redis in Docker)
- `FRONTEND_URL` - Full frontend URL for CORS

---

## Generate Secure Keys

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate TOKEN_ENCRYPTION_KEY (64 hex chars = 32 bytes for AES-256)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Monitoring & Logs

### Docker Compose
```bash
# View all logs
docker-compose logs -f

# Stream app logs only
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app
```

### Railway/Render
- Check Deployments tab for logs
- Real-time monitoring available in dashboard

### AWS CloudWatch
```bash
aws logs tail /ecs/intelligent-email-assistant --follow
```

---

## Database Migrations

### Local
```bash
# Push schema changes
docker-compose exec app npm run db:push

# Run migrations
docker-compose exec app npm run db:migrate

# Generate Prisma client
docker-compose exec app npm run db:prisma-generate
```

### Production (Railway/Render)
- Create release command in platform settings:
  ```bash
  npm run db:push
  ```
- Platform auto-runs before each deploy

---

## Troubleshooting

### Port already in use
```bash
# Change port in docker-compose.yml or use
docker-compose up -p alternate_port_5003:5002
```

### Database connection error
```bash
# Check PostgreSQL is running
docker-compose logs db

# Verify DATABASE_URL format
# postgresql://user:password@host:port/dbname
```

### Redis connection error
```bash
# Optional - Redis not required if not using BullMQ
# App falls back to in-memory queue
```

### Out of disk space
```bash
# Clean up Docker images/containers
docker system prune -a

# Remove old volumes
docker volume prune
```

---

## Security Checklist

- [ ] Change `JWT_SECRET` to a secure random value
- [ ] Change `TOKEN_ENCRYPTION_KEY` to a secure random value
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS in production
- [ ] Set up strong database password
- [ ] Enable PostgreSQL SSL connections
- [ ] Rotate OAuth credentials regularly
- [ ] Use environment-specific .env files
- [ ] Enable firewall rules (only allow needed ports)
- [ ] Set up monitoring and alerts

---

## Cost Estimates

| Platform | Min Cost | Recommended |
|----------|----------|-------------|
| **Railway** | Free tier | $5-20/month |
| **Render** | $0 (free tier) | $12-20/month |
| **DigitalOcean** | $4/month | $12-20/month |
| **AWS Fargate** | Pay-as-you-go | $20-50/month |

---

## Next Steps

1. **Choose a platform** (Railway recommended)
2. **Generate secure keys** (see above)
3. **Configure environment variables**
4. **Deploy** using platform-specific steps
5. **Test** at your deployed URL
6. **Set up Google OAuth** if needed
7. **Monitor logs** and performance

---

## Support

- 📖 Check README.md for architecture details
- 🐛 View logs for errors
- 🔑 Verify all environment variables are set
- 🗄️ Ensure database migrations ran successfully