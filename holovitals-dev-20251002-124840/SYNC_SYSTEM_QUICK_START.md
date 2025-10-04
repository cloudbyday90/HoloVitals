# EHR Sync System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start Redis (1 minute)

**Using Docker (Recommended):**
```bash
docker run -d --name holovitals-redis -p 6379:6379 redis:7-alpine
```

**Verify Redis is running:**
```bash
docker ps | grep redis
# OR
redis-cli ping  # Should return: PONG
```

### Step 2: Configure Environment (1 minute)

Create or update `.env.local`:
```env
# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Sync System
SYNC_ENABLED="true"
SYNC_BATCH_SIZE="100"
```

### Step 3: Run Database Migration (2 minutes)

```bash
cd medical-analysis-platform
npx prisma migrate dev --name add_sync_system
npx prisma generate
```

### Step 4: Start Application (1 minute)

```bash
npm run dev
```

### Step 5: Access Sync Dashboard

Open browser: `http://localhost:3000/sync`

---

## 🎯 Quick Test

### Create Your First Sync Job

**Via API:**
```bash
curl -X POST http://localhost:3000/api/sync/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PATIENT_SYNC",
    "direction": "INBOUND",
    "priority": 2,
    "ehrProvider": "epic",
    "ehrConnectionId": "test_connection",
    "patientId": "test_patient"
  }'
```

**Via Dashboard:**
1. Go to `/sync`
2. View real-time job status
3. Monitor queue statistics
4. Check sync history

---

## 📊 What You Get

### Dashboard Features
- ✅ Real-time job monitoring
- ✅ Queue statistics (waiting, active, completed, failed)
- ✅ Records synced counter
- ✅ Average duration tracking
- ✅ Recent jobs list with status
- ✅ Conflict management
- ✅ Auto-refresh every 30 seconds

### API Endpoints
- ✅ Create sync jobs
- ✅ List and filter jobs
- ✅ Get job details
- ✅ Cancel jobs
- ✅ Retry failed jobs
- ✅ View statistics
- ✅ Manage webhooks
- ✅ Resolve conflicts

### Supported EHR Providers
- ✅ Epic Systems (41.3% market share)
- ✅ Oracle Cerner (21.8%)
- ✅ MEDITECH (11.9%)
- ✅ Allscripts/Veradigm
- ✅ NextGen Healthcare
- ✅ athenahealth (1.1%)
- ✅ eClinicalWorks

**Total Market Coverage: 75%+**

---

## 🔧 Common Tasks

### Monitor Queue Status
```typescript
// Get queue statistics
const stats = await fetch('/api/sync/statistics');
const data = await stats.json();
console.log('Total Jobs:', data.totalJobs);
console.log('Completed:', data.completedJobs);
console.log('Failed:', data.failedJobs);
```

### List Recent Jobs
```typescript
// Get last 20 jobs
const response = await fetch('/api/sync/jobs?limit=20');
const jobs = await response.json();
```

### Check Specific Job
```typescript
// Get job details
const job = await fetch('/api/sync/jobs/job_123');
const details = await job.json();
console.log('Status:', details.status);
console.log('Records Processed:', details.recordsProcessed);
```

### Configure Webhook
```typescript
// Register webhook for Epic
const webhook = await fetch('/api/sync/webhooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ehrProvider: 'epic',
    ehrConnectionId: 'conn_123',
    endpoint: 'https://your-app.com/webhooks/ehr',
    secret: 'your-secret-key',
    events: ['patient.updated', 'observation.created'],
  }),
});
```

---

## 🐛 Troubleshooting

### Redis Not Running
```bash
# Check if Redis is running
docker ps | grep redis

# If not running, start it
docker start holovitals-redis

# Or create new container
docker run -d --name holovitals-redis -p 6379:6379 redis:7-alpine
```

### Database Migration Failed
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix_sync_system
```

### Jobs Not Processing
1. Check Redis connection: `redis-cli ping`
2. Check application logs for worker errors
3. Verify environment variables are set
4. Restart application: `npm run dev`

### Dashboard Not Loading
1. Verify application is running: `http://localhost:3000`
2. Check browser console for errors
3. Clear browser cache
4. Try incognito/private mode

---

## 📚 Learn More

### Full Documentation
- [Complete Integration Guide](./SYNC_SYSTEM_INTEGRATION_COMPLETE.md)
- [API Reference](./medical-analysis-platform/app/api/sync/)
- [Service Documentation](./medical-analysis-platform/lib/services/sync/)

### Key Concepts
- **Sync Jobs**: Scheduled or on-demand data synchronization tasks
- **Queues**: Bull/BullMQ job queues for async processing
- **Workers**: Background processes that execute sync jobs
- **Webhooks**: Real-time event notifications from EHR systems
- **Conflicts**: Data discrepancies requiring resolution

### Architecture
```
User → API → Queue → Worker → EHR Provider
                ↓
            Database
                ↓
            Dashboard
```

---

## ✅ Success Checklist

- [ ] Redis running on port 6379
- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] Application running on port 3000
- [ ] Sync dashboard accessible at `/sync`
- [ ] First sync job created successfully
- [ ] Queue statistics showing data
- [ ] No errors in application logs

---

## 🎉 You're Ready!

The EHR Sync System is now fully operational. You can:

1. **Create sync jobs** via API or dashboard
2. **Monitor progress** in real-time
3. **Configure webhooks** for automatic updates
4. **Resolve conflicts** through the UI
5. **View statistics** and performance metrics

**Next Steps:**
- Connect to your first EHR provider
- Set up webhook endpoints
- Configure transformation rules
- Test conflict resolution
- Monitor performance

**Need Help?**
- Check the [Full Documentation](./SYNC_SYSTEM_INTEGRATION_COMPLETE.md)
- Review error logs in the database
- Check application console output
- Verify Redis and database connectivity

---

**Status:** ✅ Ready to Sync!

**Time to First Sync:** ~5 minutes
**Market Coverage:** 75%+ of U.S. hospitals
**Supported Providers:** 7 major EHR systems