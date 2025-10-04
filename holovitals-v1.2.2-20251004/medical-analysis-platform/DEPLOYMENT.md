# Deployment Guide

This guide covers deploying the Medical Document Analysis Platform to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- OpenAI API key
- Domain name (optional)

## Environment Setup

1. Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# OpenAI API
OPENAI_API_KEY="sk-your-openai-api-key"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Security
JWT_SECRET="your-secure-random-string"

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR="./uploads"
```

## Database Setup

1. Set up PostgreSQL database (if not already done)
2. Run Prisma migrations:

```bash
npx prisma generate
npx prisma db push
```

3. (Optional) Seed the database:

```bash
npx prisma db seed
```

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Set environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env`

**Note**: For file uploads, you'll need to configure external storage (S3, Cloudinary, etc.) as Vercel has ephemeral filesystem.

### Option 2: Railway

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Add PostgreSQL:
```bash
railway add postgresql
```

5. Deploy:
```bash
railway up
```

6. Set environment variables:
```bash
railway variables set OPENAI_API_KEY=your-key
```

### Option 3: Docker + VPS

1. Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/medical_analysis
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=medical_analysis
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

3. Build and run:
```bash
docker-compose up -d
```

### Option 4: Traditional VPS (Ubuntu)

1. SSH into your server:
```bash
ssh user@your-server-ip
```

2. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Install PostgreSQL:
```bash
sudo apt-get install postgresql postgresql-contrib
```

4. Clone and setup:
```bash
git clone <your-repo>
cd medical-analysis-platform
npm install
npx prisma generate
npx prisma db push
npm run build
```

5. Install PM2:
```bash
sudo npm install -g pm2
```

6. Start application:
```bash
pm2 start npm --name "medical-app" -- start
pm2 save
pm2 startup
```

7. Setup Nginx reverse proxy:
```bash
sudo apt-get install nginx
```

Create `/etc/nginx/sites-available/medical-app`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/medical-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. Setup SSL with Let's Encrypt:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment

### 1. Verify Deployment

- Check application is running: `curl http://localhost:3000`
- Test database connection
- Verify file uploads work
- Test OCR processing
- Test AI analysis

### 2. Monitoring

Set up monitoring with:
- Application logs
- Database performance
- API response times
- Error tracking (Sentry, LogRocket)

### 3. Backups

Set up automated backups for:
- Database (daily)
- Uploaded files (daily)
- Configuration files

Example PostgreSQL backup script:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres medical_analysis > backup_$DATE.sql
```

### 4. Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] File upload validation enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Regular security updates

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Deploy multiple app instances
- Use Redis for session storage
- Implement CDN for static assets

### Database Scaling
- Set up read replicas
- Implement connection pooling
- Use database caching (Redis)
- Consider database sharding for large datasets

### File Storage
- Move to S3/CloudFlare R2/Backblaze B2
- Implement CDN for file delivery
- Set up automatic cleanup of old files

## Troubleshooting

### Application won't start
- Check environment variables
- Verify database connection
- Check Node.js version
- Review application logs

### Database connection issues
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Verify network connectivity
- Check firewall rules

### File upload failures
- Check upload directory permissions
- Verify disk space
- Check MAX_FILE_SIZE_MB setting
- Review Nginx/server upload limits

### OCR processing slow
- Consider using cloud OCR services
- Implement job queue (Bull, BullMQ)
- Scale worker processes
- Optimize image preprocessing

## Maintenance

### Regular Tasks
- Monitor disk space
- Review application logs
- Update dependencies
- Backup verification
- Performance monitoring
- Security patches

### Monthly Tasks
- Database optimization
- Clean up old files
- Review error logs
- Update documentation
- Security audit

## Support

For deployment issues:
1. Check application logs
2. Review this documentation
3. Check GitHub issues
4. Contact development team

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)