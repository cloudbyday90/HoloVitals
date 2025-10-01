# Error Monitoring Dashboard Documentation

## Overview

The Error Monitoring Dashboard provides real-time visibility into system errors, allowing administrators to quickly identify, diagnose, and respond to issues. The dashboard is accessible only to OWNER and ADMIN roles.

---

## Features

### 1. Real-Time Error Statistics

**Metrics Displayed:**
- Total errors in selected time range
- Errors by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Error trend (comparison with previous period)
- Top error codes
- Top error endpoints

**Time Ranges:**
- Last Hour
- Last 24 Hours (default)
- Last 7 Days
- Last 30 Days

### 2. Error Severity Levels

#### CRITICAL (Red)
- System failures
- Database errors
- Service unavailable
- Programming errors
- **Action Required:** Immediate attention

#### HIGH (Orange)
- Authorization failures
- HIPAA violations
- Security issues
- **Action Required:** Review within 1 hour

#### MEDIUM (Yellow)
- Not found errors
- Conflict errors
- Business logic errors
- **Action Required:** Review within 24 hours

#### LOW (Blue)
- Rate limiting
- Validation errors
- Expected user errors
- **Action Required:** Monitor trends

### 3. Error Filtering & Search

**Filters:**
- Severity filter (All, CRITICAL, HIGH, MEDIUM, LOW)
- Search by message, code, or endpoint
- Time range selection

**Search Capabilities:**
- Full-text search across error messages
- Error code search
- Endpoint path search

### 4. Error Export

**Export Format:** CSV  
**Includes:**
- Error ID
- Timestamp
- Severity
- Message
- Error code
- Status code
- Endpoint
- HTTP method
- User ID
- IP address

**Use Cases:**
- Compliance reporting
- Trend analysis
- External analysis tools
- Long-term archival

### 5. Auto-Refresh

- Dashboard auto-refreshes every 30 seconds
- Manual refresh button available
- Real-time error monitoring

---

## Access & Permissions

### Required Role
- **OWNER** - Full access
- **ADMIN** - Full access
- **Other roles** - No access (404 page shown)

### URL
```
/dashboard/admin/errors
```

### API Endpoints

#### Get Error Statistics
```
GET /api/admin/errors/stats?range=24h
```

**Response:**
```json
{
  "total": 150,
  "bySeverity": {
    "LOW": 80,
    "MEDIUM": 50,
    "HIGH": 15,
    "CRITICAL": 5
  },
  "byCode": {
    "NOT_FOUND": 40,
    "VALIDATION_ERROR": 30
  },
  "byEndpoint": {
    "/api/documents": 60,
    "/api/users": 40
  },
  "trend": {
    "current": 150,
    "previous": 120,
    "change": 25
  }
}
```

#### Get Recent Errors
```
GET /api/admin/errors?limit=50&severity=CRITICAL
```

**Response:**
```json
{
  "errors": [
    {
      "id": "error-123",
      "severity": "CRITICAL",
      "message": "Database connection failed",
      "code": "DB_CONNECTION_ERROR",
      "statusCode": 503,
      "endpoint": "/api/documents",
      "userId": "user-456",
      "timestamp": "2025-01-30T12:34:56.789Z"
    }
  ],
  "count": 1
}
```

#### Export Error Logs
```
GET /api/admin/errors/export?range=7d
```

**Response:** CSV file download

---

## Dashboard Components

### 1. Stats Cards

**Total Errors Card:**
- Shows total error count
- Displays trend indicator (up/down arrow)
- Percentage change vs previous period

**Critical Errors Card:**
- Red highlight for visibility
- Count of critical errors
- "Requires immediate attention" message

**High Severity Card:**
- Orange highlight
- Count of high severity errors
- "Security and authorization issues" message

**Medium/Low Card:**
- Yellow highlight
- Combined count
- "Expected errors and validation issues" message

### 2. Error Distribution Charts

**Top Error Codes:**
- Bar chart showing most common error codes
- Percentage of total errors
- Top 5 error codes displayed

**Top Error Endpoints:**
- Bar chart showing endpoints with most errors
- Percentage of total errors
- Top 5 endpoints displayed

### 3. Recent Errors Table

**Columns:**
- Severity (badge with icon)
- Message (truncated)
- Code (monospace)
- Endpoint (truncated)
- Timestamp (localized)

**Features:**
- Sortable columns
- Hover highlighting
- Responsive design
- Empty state for no errors

### 4. Error Monitoring Widget

**Compact widget for main dashboard:**
- Total errors (24h)
- Trend indicator
- Severity breakdown
- Status message
- Link to full dashboard

**Status Messages:**
- Critical errors detected (red)
- High severity errors present (orange)
- System running smoothly (green)

---

## Alert System

### Alert Channels

1. **In-App Notifications**
   - Sent to all OWNER and ADMIN users
   - Appears in notification center
   - Real-time delivery

2. **Slack Integration** (Optional)
   - Webhook-based alerts
   - Rich message formatting
   - Channel configuration

3. **Email Alerts** (Optional)
   - Sent to configured recipients
   - HTML formatted
   - Includes error details

4. **Webhook Alerts** (Optional)
   - Custom webhook URL
   - JSON payload
   - Integration with external systems

### Alert Triggers

**Critical Errors:**
- All channels enabled
- Immediate delivery
- Includes full error details

**High Severity Errors:**
- In-app notifications only
- Delivered within 5 minutes
- Batched if multiple errors

### Alert Configuration

**Environment Variables:**
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
```

**API Configuration:**
```typescript
POST /api/admin/errors/alerts
{
  "action": "configure",
  "config": {
    "channels": ["EMAIL", "SLACK", "IN_APP"],
    "recipients": ["admin@example.com"],
    "slackWebhook": "https://...",
    "webhookUrl": "https://..."
  }
}
```

---

## Usage Examples

### Monitoring Critical Errors

1. Navigate to `/dashboard/admin/errors`
2. Set severity filter to "Critical"
3. Review error messages and codes
4. Click on error for full details
5. Take corrective action
6. Monitor for resolution

### Analyzing Error Trends

1. Select "Last 7 Days" time range
2. Review trend indicator
3. Check "Top Error Codes" chart
4. Identify patterns
5. Export data for analysis
6. Implement fixes

### Responding to Alerts

1. Receive in-app notification
2. Click notification to view error
3. Review error details
4. Check related errors
5. Diagnose root cause
6. Deploy fix
7. Monitor for recurrence

### Exporting Error Reports

1. Select desired time range
2. Apply filters if needed
3. Click "Export" button
4. Download CSV file
5. Open in spreadsheet software
6. Analyze data
7. Create reports

---

## Best Practices

### 1. Regular Monitoring

- Check dashboard daily
- Review critical errors immediately
- Monitor trends weekly
- Export monthly reports

### 2. Alert Configuration

- Configure Slack for critical errors
- Set up email for high severity
- Test alert channels regularly
- Update recipient lists

### 3. Error Response

- Respond to critical errors within 15 minutes
- Review high severity within 1 hour
- Analyze medium/low errors weekly
- Document recurring issues

### 4. Trend Analysis

- Compare week-over-week trends
- Identify error patterns
- Track error reduction
- Measure fix effectiveness

### 5. Documentation

- Document critical error resolutions
- Create runbooks for common errors
- Share learnings with team
- Update error handling code

---

## Troubleshooting

### Dashboard Not Loading

**Check:**
1. User has OWNER or ADMIN role
2. Database connection is working
3. ErrorLog table exists
4. Browser console for errors

**Solution:**
```bash
# Verify database
npx prisma db push

# Check user role
SELECT email, role FROM "User" WHERE email = 'your-email';
```

### No Errors Showing

**Check:**
1. Time range selection
2. Severity filter
3. Search query
4. Error logs in database

**Solution:**
```sql
-- Check if errors exist
SELECT COUNT(*) FROM "error_logs";

-- Check recent errors
SELECT * FROM "error_logs" ORDER BY "timestamp" DESC LIMIT 10;
```

### Export Not Working

**Check:**
1. User permissions
2. Database connection
3. Error log data exists
4. Browser download settings

**Solution:**
- Clear browser cache
- Try different browser
- Check server logs
- Verify API endpoint

### Alerts Not Sending

**Check:**
1. Alert configuration
2. Webhook URLs
3. Network connectivity
4. Error severity level

**Solution:**
```typescript
// Test alert configuration
await errorAlertService.sendCriticalAlert(
  'test-id',
  'Test alert',
  { timestamp: new Date() }
);
```

---

## Performance Considerations

### Database Queries

- Indexed fields for fast queries
- Limit results to prevent overload
- Use pagination for large datasets
- Cache statistics for 30 seconds

### Auto-Refresh

- 30-second refresh interval
- Debounced API calls
- Cancel pending requests on unmount
- Efficient state updates

### Export Performance

- Stream large datasets
- Limit export to 10,000 rows
- Generate CSV server-side
- Use compression for large files

---

## Security

### Access Control

- OWNER/ADMIN only
- Protected API endpoints
- Role verification on every request
- Audit log for access

### Data Privacy

- No PHI in error logs
- User IDs anonymized in exports
- IP addresses masked in reports
- Secure data transmission

### HIPAA Compliance

- Error logs don't contain PHI
- Access fully audited
- Data retention policies
- Secure storage

---

## Integration

### Slack Integration

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Setup:**
1. Create Slack app
2. Enable incoming webhooks
3. Copy webhook URL
4. Add to environment variables
5. Restart application

### Email Integration

**Supported Services:**
- SendGrid
- AWS SES
- Mailgun
- Custom SMTP

**Configuration:**
```env
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-api-key
EMAIL_FROM=alerts@holovitals.com
EMAIL_TO=admin@holovitals.com
```

### Webhook Integration

**Custom Webhook:**
```env
ALERT_WEBHOOK_URL=https://your-endpoint.com/alerts
```

**Payload:**
```json
{
  "type": "critical_error",
  "message": "Database connection failed",
  "details": {
    "code": "DB_CONNECTION_ERROR",
    "endpoint": "/api/documents",
    "timestamp": "2025-01-30T12:34:56.789Z"
  }
}
```

---

## Metrics & KPIs

### Error Rate

- Total errors per hour/day/week
- Errors per user
- Errors per endpoint
- Error rate trend

### Mean Time To Resolution (MTTR)

- Average time to fix critical errors
- Average time to fix high severity
- Trend over time
- By error type

### Error Distribution

- Percentage by severity
- Percentage by code
- Percentage by endpoint
- Percentage by user

### System Health

- Error-free periods
- Uptime percentage
- Service availability
- Performance impact

---

## Summary

The Error Monitoring Dashboard provides:
- ✅ Real-time error visibility
- ✅ Comprehensive error statistics
- ✅ Severity-based filtering
- ✅ Export capabilities
- ✅ Alert system integration
- ✅ Trend analysis
- ✅ HIPAA-compliant logging
- ✅ Role-based access control

**Access:** `/dashboard/admin/errors` (OWNER/ADMIN only)  
**Auto-Refresh:** Every 30 seconds  
**Export:** CSV format  
**Alerts:** Multiple channels supported