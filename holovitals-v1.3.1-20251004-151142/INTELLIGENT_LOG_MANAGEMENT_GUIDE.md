# Intelligent Log Management System - User Guide

## Overview

The Intelligent Log Management System prevents log bloat through error deduplication, master error code classification, automatic log rotation, and scheduled cleanup. This system can reduce log storage by 90%+ while maintaining full error tracking capabilities.

## Key Features

### 1. Error Deduplication
- **Automatic Detection**: Identical errors within a 5-minute window are automatically deduplicated
- **Occurrence Counting**: Instead of storing duplicate entries, the system increments a counter
- **Sample Stack Traces**: Keeps the 3 most recent stack traces for debugging
- **First/Last Seen**: Tracks when an error first appeared and last occurred

### 2. Master Error Code Classification
- **Automatic Grouping**: Similar errors are grouped under master error codes
- **11 Master Categories**: DATABASE, API_INTEGRATION, EHR_SYNC, VALIDATION, AUTHORIZATION, SYSTEM, NETWORK, HIPAA_COMPLIANCE, etc.
- **Resolution Guides**: Each master code includes troubleshooting guidance
- **Pattern Matching**: Errors are classified by code or message pattern

### 3. Log Rotation
- **Size-Based Rotation**: Automatically rotates logs when they reach 80% of max size (default 50 MB)
- **Compression**: Archives are automatically compressed with gzip
- **Configurable Limits**: Set maximum file sizes and total storage limits
- **Automatic Cleanup**: Old archives are deleted when storage limits are reached

### 4. Scheduled Cleanup
- **Daily Cleanup**: Runs at 2 AM to remove old logs based on retention policy
- **Deduplication**: Runs every 5 minutes to purge duplicate entries
- **Retention Policy**:
  - Critical errors: 365 days
  - High severity: 180 days
  - Medium severity: 90 days
  - Low severity: 30 days

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Log Management
MAX_LOG_FILE_SIZE_MB=50
MAX_TOTAL_LOG_SIZE_MB=500
LOG_ROTATION_THRESHOLD=0.8
LOG_RETENTION_DAYS=90

# Deduplication
ERROR_DEDUP_WINDOW_MINUTES=5
MAX_SAMPLE_STACK_TRACES=3
DEDUP_BATCH_INTERVAL_MINUTES=5

# Cleanup Schedule
CLEANUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
CRITICAL_ERROR_RETENTION_DAYS=365
HIGH_SEVERITY_RETENTION_DAYS=180
MEDIUM_SEVERITY_RETENTION_DAYS=90
LOW_SEVERITY_RETENTION_DAYS=30
```

## Installation & Setup

### 1. Run Database Migration

```bash
# Apply the schema changes
npx prisma migrate dev --name add_error_deduplication

# Or run the SQL migration directly
psql -U your_user -d your_database -f prisma/migrations/add_error_deduplication.prisma
```

### 2. Migrate Existing Error Logs

```bash
# Run the migration script to update existing error logs
npx ts-node scripts/migrate-error-logs.ts
```

### 3. Initialize Logging System

Add to your application startup (e.g., `app/layout.tsx` or `pages/_app.tsx`):

```typescript
import { initializeLogging } from '@/lib/logging/init';

// In your app initialization
await initializeLogging();
```

### 4. Update Error Logging Calls

Replace old error logger with enhanced version:

```typescript
// Old way
import { errorLogger } from '@/lib/errors/ErrorLogger';

// New way
import { enhancedErrorLogger } from '@/lib/errors/EnhancedErrorLogger';

// Usage remains the same
await enhancedErrorLogger.logError(error, {
  userId: session?.user?.id,
  endpoint: request.url,
  method: request.method,
});
```

## API Endpoints

### Get Log Statistics

```bash
GET /api/admin/logs/stats?timeRange=24

Response:
{
  "timeRange": 24,
  "errors": {
    "total": 150,
    "totalOccurrences": 1250,
    "bySeverity": {
      "LOW": 50,
      "MEDIUM": 60,
      "HIGH": 30,
      "CRITICAL": 10
    },
    "byMasterCode": {
      "DB_CONNECTION_ERROR": {
        "count": 5,
        "occurrences": 450,
        "description": "Database connection failures"
      }
    },
    "topErrors": [...]
  },
  "logs": {
    "current": {
      "sizeMB": 12.5,
      "maxSizeMB": 50,
      "percentage": 25
    },
    "archives": {
      "count": 15,
      "totalSizeMB": 245.8,
      "maxSizeMB": 500,
      "percentage": 49.16
    }
  }
}
```

### Get Master Error Codes

```bash
GET /api/admin/errors/master-codes?timeRange=24

Response:
{
  "masterCodes": [
    {
      "code": "DB_CONNECTION_ERROR",
      "category": "DATABASE",
      "description": "Database connection failures",
      "severity": "CRITICAL",
      "subCodesCount": 5,
      "errorCount": 5,
      "totalOccurrences": 450
    }
  ],
  "total": 11
}
```

### Get Specific Master Code Details

```bash
GET /api/admin/errors/master-codes?masterCode=DB_CONNECTION_ERROR&timeRange=24

Response:
{
  "masterCode": "DB_CONNECTION_ERROR",
  "category": "DATABASE",
  "description": "Database connection failures",
  "severity": "CRITICAL",
  "resolutionGuide": "Check database connection string, network connectivity...",
  "subCodes": ["DB_TIMEOUT", "DB_AUTH_FAILED", ...],
  "statistics": {
    "totalErrors": 5,
    "totalOccurrences": 450,
    "errors": [
      {
        "code": "DB_TIMEOUT",
        "message": "Connection timeout after 30s",
        "occurrences": 300,
        "firstSeen": "2025-10-04T10:00:00Z",
        "lastSeen": "2025-10-04T14:30:00Z"
      }
    ]
  }
}
```

### Manual Log Rotation

```bash
POST /api/admin/logs/rotate

Response:
{
  "success": true,
  "message": "Log rotation completed successfully",
  "stats": {
    "currentLogSizeMB": 0.5,
    "totalArchiveSizeMB": 250.3,
    "archiveCount": 16
  }
}
```

### Manual Cleanup

```bash
POST /api/admin/logs/cleanup

Response:
{
  "success": true,
  "message": "Log cleanup completed successfully",
  "results": {
    "errorLogsDeleted": {
      "critical": 0,
      "high": 5,
      "medium": 120,
      "low": 450
    },
    "duplicatesPurged": 1250
  }
}
```

### Manual Deduplication

```bash
POST /api/admin/logs/dedup

Response:
{
  "success": true,
  "message": "Error deduplication completed successfully",
  "duplicatesPurged": 85
}
```

## Master Error Codes Reference

### DATABASE Errors

- **DB_CONNECTION_ERROR**: Database connection failures
  - Sub-codes: DB_TIMEOUT, DB_AUTH_FAILED, DB_POOL_EXHAUSTED, DB_CONNECTION_REFUSED, DB_HOST_UNREACHABLE

- **DB_QUERY_ERROR**: Database query execution failures
  - Sub-codes: DB_SYNTAX_ERROR, DB_CONSTRAINT_VIOLATION, DB_DEADLOCK, DB_TRANSACTION_FAILED, DB_FOREIGN_KEY_VIOLATION

### API_INTEGRATION Errors

- **API_INTEGRATION_ERROR**: External API integration failures
  - Sub-codes: API_TIMEOUT, API_RATE_LIMIT, API_AUTH_FAILED, API_INVALID_RESPONSE, API_SERVICE_UNAVAILABLE, API_BAD_REQUEST

### EHR_SYNC Errors

- **EHR_SYNC_ERROR**: EHR data synchronization failures
  - Sub-codes: EHR_INVALID_CREDENTIALS, EHR_DATA_FORMAT_ERROR, EHR_CONNECTION_TIMEOUT, EHR_SYNC_CONFLICT, EPIC_SYNC_ERROR, CERNER_SYNC_ERROR

- **EHR_FHIR_ERROR**: FHIR protocol errors
  - Sub-codes: FHIR_VALIDATION_ERROR, FHIR_RESOURCE_NOT_FOUND, FHIR_INVALID_RESOURCE, FHIR_VERSION_MISMATCH

### VALIDATION Errors

- **VALIDATION_ERROR**: Input validation failures
  - Sub-codes: INVALID_INPUT_FORMAT, MISSING_REQUIRED_FIELD, DATA_TYPE_MISMATCH, INVALID_DATE_FORMAT, VALUE_OUT_OF_RANGE

### AUTHORIZATION Errors

- **AUTHORIZATION_ERROR**: Access control and authentication failures
  - Sub-codes: INSUFFICIENT_PERMISSIONS, INVALID_TOKEN, SESSION_EXPIRED, UNAUTHORIZED_ACCESS, INVALID_CREDENTIALS, MFA_REQUIRED

### SYSTEM Errors

- **SYSTEM_ERROR**: System-level failures
  - Sub-codes: OUT_OF_MEMORY, DISK_FULL, CPU_OVERLOAD, SERVICE_UNAVAILABLE, CONFIGURATION_ERROR, DEPENDENCY_MISSING

- **FILE_SYSTEM_ERROR**: File system operation failures
  - Sub-codes: FILE_NOT_FOUND, PERMISSION_DENIED, DISK_FULL, FILE_LOCKED, INVALID_PATH

### NETWORK Errors

- **NETWORK_ERROR**: Network connectivity failures
  - Sub-codes: CONNECTION_TIMEOUT, CONNECTION_REFUSED, DNS_RESOLUTION_FAILED, NETWORK_UNREACHABLE, SSL_CERTIFICATE_ERROR

### HIPAA_COMPLIANCE Errors

- **HIPAA_VIOLATION**: HIPAA compliance violations
  - Sub-codes: PHI_ACCESS_ERROR, UNAUTHORIZED_PHI_ACCESS, PHI_DISCLOSURE_ERROR, AUDIT_LOG_FAILURE, ENCRYPTION_ERROR, BAA_VIOLATION

## Monitoring Dashboard

The system integrates with the existing server monitoring dashboard at `/admin/server-monitoring`.

### New Metrics Available:

1. **Error Statistics**
   - Total errors vs total occurrences
   - Errors by severity
   - Errors by master code
   - Top 10 most frequent errors

2. **Log File Statistics**
   - Current log file size and percentage
   - Archive count and total size
   - Oldest and newest archives
   - Rotation threshold status

3. **Deduplication Statistics**
   - Duplicates purged in last run
   - Storage saved by deduplication
   - Deduplication efficiency percentage

## Benefits

### Storage Savings
- **Before**: 1000 identical errors = 1000 database entries + 1000 stack traces
- **After**: 1000 identical errors = 1 database entry + counter (1000) + 3 sample stack traces
- **Savings**: ~99% reduction in storage for duplicate errors

### Performance Improvements
- Faster database queries (fewer records)
- Reduced disk I/O
- Lower memory usage
- Faster error analysis

### Better Insights
- Clear error patterns and trends
- Easy identification of recurring issues
- Master error codes group related problems
- Resolution guides for common issues

## Troubleshooting

### Logs Not Rotating
1. Check log directory permissions
2. Verify MAX_LOG_FILE_SIZE_MB setting
3. Check disk space availability
4. Review rotation service logs

### Deduplication Not Working
1. Verify ERROR_DEDUP_WINDOW_MINUTES setting
2. Check if cleanup job is running
3. Review error hash generation
4. Ensure database schema is updated

### High Storage Usage
1. Reduce retention periods
2. Lower MAX_TOTAL_LOG_SIZE_MB
3. Run manual cleanup
4. Check for critical errors (never deleted)

### Missing Error Statistics
1. Run migration script
2. Verify master code classification
3. Check database indexes
4. Review error logger implementation

## Best Practices

1. **Monitor Regularly**: Check log statistics weekly
2. **Adjust Retention**: Balance storage vs compliance needs
3. **Review Master Codes**: Analyze top errors monthly
4. **Test Rotation**: Verify log rotation works correctly
5. **Backup Archives**: Keep compressed archives for compliance
6. **Update Resolution Guides**: Add solutions as you resolve issues
7. **Alert on Critical**: Set up alerts for critical error spikes

## Support

For issues or questions:
1. Check the logs at `/var/log/holovitals/`
2. Review error statistics at `/api/admin/logs/stats`
3. Check master error codes at `/api/admin/errors/master-codes`
4. Contact system administrator