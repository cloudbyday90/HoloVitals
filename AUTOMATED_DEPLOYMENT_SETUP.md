# Automated Deployment & Monitoring Setup Guide

## Overview

This guide will help you set up:
1. **Automated deployment** from GitHub to your server
2. **Real-time server monitoring** dashboard
3. **Remote API access** for AI-assisted development
4. **Webhook notifications** for critical issues

## Prerequisites

- ✅ HoloVitals installed on Ubuntu server
- ✅ Server accessible at holovitals.net
- ✅ GitHub repository access
- ✅ Admin access to the server

---

## Part 1: GitHub Actions Setup (15 minutes)

### Step 1: Generate SSH Key for Deployment

On your server:
```bash
# Generate deployment key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""

# Add to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Display private key (copy this)
cat ~/.ssh/github_deploy
```

### Step 2: Add GitHub Secrets

Go to: https://github.com/cloudbyday90/HoloVitals/settings/secrets/actions

Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `SERVER_HOST` | `holovitals.net` | Your domain |
| `SERVER_USER` | `holovitalsdev` | Your SSH username |
| `SSH_PRIVATE_KEY` | `<private key>` | Output from Step 1 |
| `DATABASE_URL` | `postgresql://...` | From server's `.env.local` |
| `NEXTAUTH_SECRET` | `<secret>` | From server's `.env.local` |

**Optional (for notifications):**
| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `TELEGRAM_BOT_TOKEN` | `<token>` | Message @BotFather on Telegram |
| `TELEGRAM_CHAT_ID` | `<chat_id>` | Message @userinfobot on Telegram |

### Step 3: Test Automated Deployment

1. Go to: https://github.com/cloudbyday90/HoloVitals/actions
2. Click **Deploy to Production**
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

The deployment should complete in ~5 minutes.

---

## Part 2: Server Monitoring Setup (10 minutes)

### Step 1: Add Database Schema

On your server:
```bash
cd ~/HoloVitals

# Add monitoring schema to Prisma
cat prisma/schema-server-monitoring.prisma >> prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name add_server_monitoring
```

### Step 2: Initialize Monitoring

Add to your server startup (in `ecosystem.config.js` or startup script):

```javascript
// In your Next.js app startup
import { initializeMonitoring } from '@/lib/monitoring/init';

// Start monitoring
initializeMonitoring();
```

Or manually start:
```bash
cd ~/HoloVitals
node -e "require('./lib/monitoring/init').initializeMonitoring()"
```

### Step 3: Verify Monitoring

Check if monitoring is running:
```bash
# Check logs
pm2 logs holovitals | grep "monitoring"

# Should see: "✅ Server monitoring initialized successfully"
```

### Step 4: Access Dashboard

Open in browser:
```
https://holovitals.net/admin/server-monitoring
```

You should see:
- ✅ Real-time CPU, Memory, Disk, Network metrics
- ✅ 24-hour trend charts
- ✅ Error logs
- ✅ Process information

---

## Part 3: Remote API Access Setup (5 minutes)

### Step 1: Generate API Key

On your server:
```bash
cd ~/HoloVitals

# Generate secure API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Add to Environment

```bash
# Edit .env.local
nano .env.local

# Add this line:
MONITORING_API_KEY=<generated_key_from_step_1>
```

### Step 3: Restart Application

```bash
pm2 restart holovitals
```

### Step 4: Test API Access

```bash
# Test health check (public)
curl https://holovitals.net/api/monitoring/health

# Test authenticated endpoint
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://holovitals.net/api/monitoring/status
```

---

## Part 4: Webhook Notifications (Optional, 10 minutes)

### Option A: Discord Webhook

1. Go to your Discord server
2. Server Settings → Integrations → Webhooks
3. Create webhook, copy URL
4. Add to `.env.local`:
   ```
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

### Option B: Slack Webhook

1. Go to https://api.slack.com/apps
2. Create app → Incoming Webhooks
3. Add webhook to workspace
4. Copy webhook URL
5. Add to `.env.local`:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

### Option C: Telegram Bot

1. Message @BotFather on Telegram
2. Create new bot with `/newbot`
3. Copy bot token
4. Message @userinfobot to get your chat ID
5. Add to `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   TELEGRAM_CHAT_ID=123456789
   ```

### Test Webhook

```bash
# Restart to load new env vars
pm2 restart holovitals

# Trigger a test alert (will send to configured webhooks)
curl -X POST https://holovitals.net/api/monitoring/test-alert \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Part 5: How I (SuperNinja) Will Access Your Server

### Method 1: Via Monitoring API (Recommended)

I can poll these endpoints:

```bash
# Check health every 5 minutes
GET https://holovitals.net/api/monitoring/health

# Get detailed status when issues detected
GET https://holovitals.net/api/monitoring/status

# Pull error logs
GET https://holovitals.net/api/monitoring/logs?level=error

# Get metrics history
GET https://holovitals.net/api/monitoring/metrics?hours=24
```

**What I need from you:**
- Share the `MONITORING_API_KEY` with me (securely)
- Or give me ADMIN access to the web dashboard

### Method 2: Via Webhook Notifications

Configure a webhook to send alerts to a URL I monitor:

```bash
# Add to .env.local
CUSTOM_WEBHOOK_URL=https://superninja-monitoring.example.com/webhook
```

I'll receive real-time notifications when:
- CPU/Memory/Disk usage is critical
- Errors occur
- Deployments fail
- Application crashes

### Method 3: Via GitHub Actions Logs

I can monitor GitHub Actions deployment logs:
- https://github.com/cloudbyday90/HoloVitals/actions

### Method 4: Direct SSH Access (Optional)

If you want to give me direct server access:

```bash
# On your server, add my SSH public key
echo "ssh-ed25519 AAAAC3... superninja@holovitals" >> ~/.ssh/authorized_keys
```

Then I can SSH in to debug issues directly.

---

## Automated Deployment Workflow

### How It Works

1. **You or I push code to GitHub main branch**
2. **GitHub Actions triggers automatically**
3. **Deployment script runs on server:**
   - Creates backup
   - Pulls latest code
   - Installs dependencies
   - Generates Prisma client
   - Runs migrations
   - Builds application
   - Restarts PM2
   - Performs health check
4. **Webhook notification sent** (success or failure)
5. **Monitoring dashboard updates** with new deployment

### Manual Deployment

If you need to deploy manually:

```bash
cd ~/HoloVitals
bash scripts/deploy-server.sh
```

### Rollback

If deployment fails, it automatically rolls back. To manually rollback:

```bash
cd ~/HoloVitals

# List backups
ls -lh ~/holovitals-backups/

# Restore from backup
tar -xzf ~/holovitals-backups/backup_TIMESTAMP.tar.gz

# Restart
pm2 restart holovitals
```

---

## Monitoring Dashboard Features

### Real-Time Metrics (Auto-refresh every 30s)
- ✅ CPU usage and load average
- ✅ Memory usage
- ✅ Disk usage
- ✅ Network traffic
- ✅ Process count

### Historical Data
- ✅ 24-hour trend charts
- ✅ CPU, Memory, Disk trends
- ✅ Identify patterns and spikes

### Error Logs
- ✅ Last 24 hours of errors
- ✅ Filter by severity
- ✅ Source tracking
- ✅ Metadata for debugging

### API Access Info
- ✅ Endpoint URLs
- ✅ Authentication requirements
- ✅ Example requests

---

## Remote Development Workflow

### Scenario 1: I Detect an Issue

1. **I monitor:** Poll `/api/monitoring/health` every 5 minutes
2. **Issue detected:** Status changes to `warning` or `critical`
3. **I investigate:** Pull logs via `/api/monitoring/logs?level=error`
4. **I fix:** Create fix in GitHub, push to main
5. **Auto-deploy:** GitHub Actions deploys automatically
6. **I verify:** Check `/api/monitoring/health` again

### Scenario 2: You Report an Issue

1. **You:** "The app is slow"
2. **I check:** Access monitoring dashboard or API
3. **I diagnose:** Review metrics and logs
4. **I fix:** Push fix to GitHub
5. **Auto-deploy:** Deploys automatically
6. **I verify:** Confirm fix via monitoring

### Scenario 3: Proactive Maintenance

1. **I monitor:** Continuous health checks
2. **I detect:** Memory usage trending up
3. **I optimize:** Create performance improvements
4. **I deploy:** Push to GitHub, auto-deploys
5. **I verify:** Monitor metrics to confirm improvement

---

## Security Considerations

### API Key Security
- ✅ Store API key in environment variables
- ✅ Never commit to Git
- ✅ Rotate regularly (every 90 days)
- ✅ Use different keys for different environments

### Webhook Security
- ✅ Use HTTPS only
- ✅ Verify webhook signatures
- ✅ Rate limit webhook endpoints
- ✅ Log all webhook deliveries

### SSH Access
- ✅ Use SSH keys, not passwords
- ✅ Disable root login
- ✅ Use fail2ban for brute force protection
- ✅ Audit SSH access logs

---

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. SSH into server and check:
   ```bash
   pm2 logs holovitals --lines 100
   ```
3. Verify secrets are configured correctly
4. Check disk space: `df -h`

### Monitoring Not Working

1. Verify database schema is updated:
   ```bash
   cd ~/HoloVitals
   npx prisma db pull
   ```
2. Check if monitoring is initialized:
   ```bash
   pm2 logs holovitals | grep monitoring
   ```
3. Restart application:
   ```bash
   pm2 restart holovitals
   ```

### API Returns 401 Unauthorized

1. Verify you're logged in as ADMIN
2. Check API key is correct
3. Verify session is valid

---

## Next Steps

After setup is complete:

1. ✅ Test automated deployment
2. ✅ Verify monitoring dashboard
3. ✅ Test API access
4. ✅ Configure webhooks
5. ✅ Share API key with me (SuperNinja)
6. ✅ Start continuous monitoring

---

## Summary

Once configured, you'll have:

✅ **Automated Deployment**
- Push to GitHub → Auto-deploy to server
- Automatic backups before deployment
- Automatic rollback on failure
- Health checks after deployment

✅ **Real-Time Monitoring**
- Dashboard at holovitals.net/admin/server-monitoring
- CPU, Memory, Disk, Network metrics
- Error log tracking
- 24-hour trend analysis

✅ **Remote Access for AI**
- I can monitor server health 24/7
- Automatic issue detection
- Proactive fixes via GitHub
- Minimal downtime

✅ **Webhook Notifications**
- Instant alerts for critical issues
- Deployment notifications
- Integration with Discord/Slack/Telegram

**Result:** Continuous monitoring and automated maintenance with minimal manual intervention!