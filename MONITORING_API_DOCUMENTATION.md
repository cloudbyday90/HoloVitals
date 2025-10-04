# Server Monitoring API Documentation

## Overview

The Server Monitoring API provides real-time access to server health metrics, logs, and deployment information. This allows remote monitoring and automated issue detection.

## Base URL

```
https://holovitals.net/api/monitoring
```

## Authentication

All endpoints except `/health` require **ADMIN role authentication**.

**Authentication Method:** NextAuth session-based authentication

**Headers:**
```
Cookie: next-auth.session-token=<session_token>
```

## Endpoints

### 1. Health Check (Public)

**Endpoint:** `GET /api/monitoring/health`

**Description:** Public health check endpoint for uptime monitoring and load balancers.

**Authentication:** None required

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-04T14:00:00Z",
  "uptime": 86400,
  "activeIssues": 0
}
```

**Status Values:**
- `healthy` - All systems operational
- `warning` - Some metrics elevated but functional
- `critical` - Immediate attention required

**Example:**
```bash
curl https://holovitals.net/api/monitoring/health
```

---

### 2. Current Server Status

**Endpoint:** `GET /api/monitoring/status`

**Description:** Get current server status with real-time metrics and active issues.

**Authentication:** Required (ADMIN)

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "metrics": {
      "timestamp": "2025-10-04T14:00:00Z",
      "cpu": {
        "usage": 45.2,
        "loadAverage": [1.5, 1.2, 1.0],
        "cores": 4
      },
      "memory": {
        "total": 8589934592,
        "used": 4294967296,
        "free": 4294967296,
        "usagePercent": 50.0
      },
      "disk": {
        "total": 107374182400,
        "used": 53687091200,
        "free": 53687091200,
        "usagePercent": 50.0
      },
      "network": {
        "bytesReceived": 1073741824,
        "bytesSent": 536870912
      },
      "processes": {
        "total": 150,
        "running": 3
      }
    },
    "issues": []
  }
}
```

**Example:**
```bash
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://holovitals.net/api/monitoring/status
```

---

### 3. Metrics History

**Endpoint:** `GET /api/monitoring/metrics`

**Description:** Get historical server metrics for trend analysis.

**Authentication:** Required (ADMIN)

**Query Parameters:**
- `hours` (optional) - Number of hours to retrieve (default: 24, max: 168)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-10-04T14:00:00Z",
      "cpu": { "usage": 45.2, "loadAverage": [1.5, 1.2, 1.0], "cores": 4 },
      "memory": { "total": 8589934592, "used": 4294967296, "free": 4294967296, "usagePercent": 50.0 },
      "disk": { "total": 107374182400, "used": 53687091200, "free": 53687091200, "usagePercent": 50.0 },
      "network": { "bytesReceived": 1073741824, "bytesSent": 536870912 },
      "processes": { "total": 150, "running": 3 }
    }
  ],
  "count": 24
}
```

**Example:**
```bash
# Get last 24 hours
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://holovitals.net/api/monitoring/metrics?hours=24

# Get last 7 days
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://holovitals.net/api/monitoring/metrics?hours=168
```

---

### 4. Server Logs

**Endpoint:** `GET /api/monitoring/logs`

**Description:** Get server logs with filtering options.

**Authentication:** Required (ADMIN)

**Query Parameters:**
- `hours` (optional) - Number of hours to retrieve (default: 24)
- `level` (optional) - Filter by log level: `info`, `warn`, `error`, `debug`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-10-04T14:00:00Z",
      "level": "error",
      "source": "application",
      "message": "Database connection timeout",
      "metadata": {
        "query": "SELECT * FROM users",
        "duration": 5000
      }
    }
  ],
  "count": 15
}
```

**Examples:**
```bash
# Get all logs from last 24 hours
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://holovitals.net/api/monitoring/logs?hours=24

# Get only error logs
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://holovitals.net/api/monitoring/logs?level=error

# Get warnings from last 12 hours
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://holovitals.net/api/monitoring/logs?hours=12&level=warn
```

---

## Remote Access for AI Agent

### How I (SuperNinja) Can Access Your Server

Once the monitoring system is deployed, I can access your server data through these APIs:

**1. Check Server Health:**
```bash
curl https://holovitals.net/api/monitoring/health
```

**2. Get Detailed Status (with auth):**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://holovitals.net/api/monitoring/status
```

**3. Monitor for Issues:**
```bash
# Check for errors in last hour
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://holovitals.net/api/monitoring/logs?hours=1&level=error
```

### Automated Monitoring

I can set up automated checks that:
1. Poll `/api/monitoring/health` every 5 minutes
2. Alert when status changes to `warning` or `critical`
3. Automatically pull logs when errors are detected
4. Create GitHub issues for critical problems
5. Deploy fixes automatically via GitHub Actions

### API Key Setup

To give me programmatic access, you can:

**Option 1: Create an API Key**
```bash
# On your server
cd ~/HoloVitals
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then add to `.env.local`:
```
MONITORING_API_KEY=<generated_key>
```

**Option 2: Use NextAuth Session**
- I can authenticate via the web interface
- Session token is stored and used for API calls

## Webhook Notifications

### Setup Webhook for Critical Alerts

You can configure webhooks to notify external systems (including me) when critical issues occur:

**Webhook Payload:**
```json
{
  "event": "server.alert",
  "severity": "critical",
  "timestamp": "2025-10-04T14:00:00Z",
  "message": "CPU usage critically high (>90%)",
  "metrics": {
    "cpu": { "usage": 95.5 }
  }
}
```

**Webhook Endpoints:**
- Discord webhook
- Slack webhook
- Custom HTTP endpoint
- Telegram bot

## Monitoring Dashboard Access

**URL:** https://holovitals.net/admin/server-monitoring

**Features:**
- Real-time metrics visualization
- 24-hour trend charts
- Error log viewer
- Process information
- Auto-refresh every 30 seconds

## Data Retention

- **Metrics:** 7 days
- **Logs:** 30 days
- **Deployments:** Unlimited

## Rate Limits

- Health check: Unlimited
- Other endpoints: 100 requests/minute per user

## Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch metrics"
}
```

## Security Notes

- ✅ All endpoints use HTTPS
- ✅ Authentication required for sensitive data
- ✅ Rate limiting enabled
- ✅ CORS configured for holovitals.net only
- ✅ Audit logging for all API access

## Integration Examples

### Python Script
```python
import requests

API_KEY = "your_api_key"
BASE_URL = "https://holovitals.net/api/monitoring"

def check_server_health():
    response = requests.get(f"{BASE_URL}/health")
    data = response.json()
    
    if data['status'] != 'healthy':
        print(f"⚠️  Server status: {data['status']}")
        print(f"Active issues: {data['activeIssues']}")
        
        # Get detailed logs
        logs = requests.get(
            f"{BASE_URL}/logs?level=error",
            headers={"Authorization": f"Bearer {API_KEY}"}
        ).json()
        
        for log in logs['data'][:5]:
            print(f"Error: {log['message']}")

check_server_health()
```

### Node.js Script
```javascript
const axios = require('axios');

const API_KEY = 'your_api_key';
const BASE_URL = 'https://holovitals.net/api/monitoring';

async function monitorServer() {
  try {
    const health = await axios.get(`${BASE_URL}/health`);
    
    if (health.data.status !== 'healthy') {
      console.log(`⚠️  Server status: ${health.data.status}`);
      
      // Get detailed status
      const status = await axios.get(`${BASE_URL}/status`, {
        headers: { Authorization: `Bearer ${API_KEY}` }
      });
      
      console.log('Issues:', status.data.data.issues);
    }
  } catch (error) {
    console.error('Monitoring failed:', error.message);
  }
}

setInterval(monitorServer, 300000); // Every 5 minutes
```

## Next Steps

1. Deploy the monitoring system
2. Configure API keys
3. Set up automated monitoring
4. Configure webhook notifications
5. Test remote access