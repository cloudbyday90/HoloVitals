# Intelligent Log Management System Design

## Overview
This system prevents log bloat by deduplicating errors, grouping similar errors under master error codes, and implementing intelligent log rotation with size limits.

## Key Features

### 1. Master Error Code System
Similar errors are grouped under master error codes for easier tracking and resolution:

```
MASTER_ERROR_CODE: Description
├── SUB_CODE_1: Specific variant
├── SUB_CODE_2: Another variant
└── SUB_CODE_3: Yet another variant
```

**Example Master Error Codes:**

- **DB_CONNECTION_ERROR** - All database connection issues
  - DB_TIMEOUT
  - DB_AUTH_FAILED
  - DB_POOL_EXHAUSTED
  
- **API_INTEGRATION_ERROR** - External API failures
  - API_TIMEOUT
  - API_RATE_LIMIT
  - API_AUTH_FAILED
  
- **EHR_SYNC_ERROR** - EHR synchronization issues
  - EHR_INVALID_CREDENTIALS
  - EHR_DATA_FORMAT_ERROR
  - EHR_CONNECTION_TIMEOUT

- **VALIDATION_ERROR** - Input validation failures
  - INVALID_INPUT_FORMAT
  - MISSING_REQUIRED_FIELD
  - DATA_TYPE_MISMATCH

- **AUTHORIZATION_ERROR** - Access control issues
  - INSUFFICIENT_PERMISSIONS
  - INVALID_TOKEN
  - SESSION_EXPIRED

### 2. Error Deduplication Strategy

Instead of storing every error occurrence:

**Before (Bloated):**
```
[2025-10-04 10:00:01] DB_TIMEOUT: Connection timeout
[2025-10-04 10:00:05] DB_TIMEOUT: Connection timeout
[2025-10-04 10:00:12] DB_TIMEOUT: Connection timeout
... (1000 more identical entries)
```

**After (Efficient):**
```
Master Error: DB_CONNECTION_ERROR
├── DB_TIMEOUT
    ├── First Occurrence: 2025-10-04 10:00:01
    ├── Last Occurrence: 2025-10-04 12:45:23
    ├── Count: 1,003
    └── Sample Stack Traces: [3 most recent]
```

### 3. Log File Size Management

**Configuration:**
- Maximum log file size: 50 MB (configurable)
- Maximum total log storage: 500 MB (configurable)
- Rotation strategy: When file reaches 80% of max size
- Archive old logs: Compress and store for 90 days

**File Structure:**
```
/logs
├── current.log (active log file)
├── error-summary.json (deduplicated error counts)
├── archives/
│   ├── 2025-10-03.log.gz
│   ├── 2025-10-02.log.gz
│   └── 2025-10-01.log.gz
└── critical/
    └── critical-errors.log (never rotated, only critical)
```

### 4. Database Schema Updates

**New Table: ErrorMaster**
```sql
CREATE TABLE error_masters (
  id UUID PRIMARY KEY,
  master_code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  resolution_guide TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Updated Table: ErrorLog**
```sql
ALTER TABLE error_logs ADD COLUMN master_error_id UUID REFERENCES error_masters(id);
ALTER TABLE error_logs ADD COLUMN occurrence_count INTEGER DEFAULT 1;
ALTER TABLE error_logs ADD COLUMN first_seen TIMESTAMP;
ALTER TABLE error_logs ADD COLUMN last_seen TIMESTAMP;
ALTER TABLE error_logs ADD COLUMN sample_stacks JSONB; -- Store 3 most recent stack traces
ALTER TABLE error_logs ADD COLUMN is_duplicate BOOLEAN DEFAULT FALSE;
```

### 5. Intelligent Cleanup Rules

**Retention Policy:**
- Critical errors: Keep forever (with deduplication)
- High severity: Keep 180 days
- Medium severity: Keep 90 days
- Low severity: Keep 30 days

**Deduplication Rules:**
- If same error (code + message) occurs within 5 minutes: Increment counter
- Keep first occurrence timestamp
- Update last occurrence timestamp
- Store only 3 most recent stack traces
- Purge duplicate entries after 24 hours

**Size-Based Cleanup:**
- If total log size > 500 MB: Archive oldest logs
- If archive size > 2 GB: Delete oldest archives
- Always keep at least 7 days of logs

### 6. Performance Optimizations

**Indexing Strategy:**
```sql
CREATE INDEX idx_error_master_code ON error_logs(master_error_id, code);
CREATE INDEX idx_error_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_duplicate ON error_logs(is_duplicate, last_seen);
CREATE INDEX idx_error_cleanup ON error_logs(severity, timestamp);
```

**Batch Processing:**
- Deduplication runs every 5 minutes
- Cleanup runs daily at 2 AM
- Log rotation checks every hour

### 7. API Endpoints

**Error Statistics:**
```
GET /api/admin/errors/stats
- Returns deduplicated error counts
- Groups by master error code
- Shows trends over time
```

**Error Details:**
```
GET /api/admin/errors/:masterCode
- Shows all sub-errors under master code
- Displays occurrence counts
- Provides resolution guides
```

**Log Management:**
```
POST /api/admin/logs/rotate
- Manually trigger log rotation

POST /api/admin/logs/cleanup
- Manually trigger cleanup

GET /api/admin/logs/size
- Get current log sizes and limits
```

## Implementation Priority

1. **Phase 1: Core Infrastructure**
   - Master error code mapping
   - Error deduplication logic
   - Database schema updates

2. **Phase 2: Log Management**
   - File size monitoring
   - Log rotation system
   - Archive management

3. **Phase 3: Cleanup & Optimization**
   - Automated cleanup jobs
   - Performance optimizations
   - Monitoring dashboard updates

4. **Phase 4: Testing & Documentation**
   - Unit tests
   - Integration tests
   - User documentation

## Configuration

**Environment Variables:**
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

# Cleanup
CLEANUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
CRITICAL_ERROR_RETENTION_DAYS=365
HIGH_SEVERITY_RETENTION_DAYS=180
MEDIUM_SEVERITY_RETENTION_DAYS=90
LOW_SEVERITY_RETENTION_DAYS=30
```

## Benefits

1. **Reduced Storage**: 90%+ reduction in log storage
2. **Better Insights**: Clear error patterns and trends
3. **Faster Debugging**: Master error codes group related issues
4. **Cost Savings**: Less database storage needed
5. **Performance**: Faster queries with deduplication
6. **Maintainability**: Easier to manage and monitor

## Migration Strategy

1. Create new tables and columns
2. Run migration script to classify existing errors
3. Enable deduplication for new errors
4. Gradually clean up old duplicates
5. Monitor and adjust thresholds