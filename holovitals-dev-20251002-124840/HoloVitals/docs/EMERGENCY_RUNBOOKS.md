# Emergency Runbooks - HoloVitals

## Overview

This document contains detailed runbooks for responding to critical incidents and system outages. Each runbook provides step-by-step procedures for diagnosis, resolution, and recovery.

---

## Table of Contents

1. [Complete System Outage](#1-complete-system-outage)
2. [Database Connection Failure](#2-database-connection-failure)
3. [AI Service Unavailable](#3-ai-service-unavailable)
4. [Authentication System Down](#4-authentication-system-down)
5. [Data Corruption Detected](#5-data-corruption-detected)
6. [Security Breach Response](#6-security-breach-response)
7. [HIPAA Compliance Violation](#7-hipaa-compliance-violation)
8. [Performance Degradation](#8-performance-degradation)

---

## 1. Complete System Outage

**Severity:** SEV1 - CRITICAL  
**Response Time:** Immediate  
**Escalation:** CTO, Technical Lead, On-call Engineer

### Detection Criteria
- All API endpoints returning 5xx errors
- Health checks failing across all services
- User reports of complete inability to access system
- Monitoring alerts showing 0% availability

### Immediate Actions (First 5 Minutes)

1. **Acknowledge Incident**
   ```bash
   # Create incident
   curl -X POST https://api.holovitals.com/incidents \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "severity": "SEV1",
       "title": "Complete System Outage",
       "description": "All services unavailable",
       "detectedBy": "monitoring"
     }'
   ```

2. **Notify Team**
   - Page on-call engineer (SMS + Phone)
   - Alert technical lead (SMS + Slack)
   - Notify CTO (SMS)
   - Post in #incidents Slack channel

3. **Check System Status**
   ```bash
   # Check overall system health
   curl https://api.holovitals.com/health/system
   
   # Check individual services
   curl https://api.holovitals.com/health/services
   ```

### Diagnosis Steps (5-10 Minutes)

1. **Check Infrastructure**
   ```bash
   # Check server status
   ssh admin@production-server
   systemctl status holovitals-api
   systemctl status holovitals-worker
   
   # Check resource usage
   top
   df -h
   free -m
   ```

2. **Check Database**
   ```bash
   # Test database connection
   psql -h db.holovitals.com -U admin -d holovitals -c "SELECT 1;"
   
   # Check database status
   pg_isready -h db.holovitals.com
   ```

3. **Check Recent Changes**
   ```bash
   # Get recent deployments
   curl https://api.holovitals.com/deployments?limit=5
   
   # Get recent changes
   curl https://api.holovitals.com/changes?status=COMPLETED&limit=5
   ```

4. **Review Error Logs**
   ```bash
   # Check application logs
   tail -n 100 /var/log/holovitals/app.log
   
   # Check system logs
   journalctl -u holovitals-api -n 100
   ```

### Resolution Procedures

#### Option 1: Emergency Rollback (Fastest - 2 minutes)

```bash
# Trigger emergency rollback via API
curl -X POST https://api.holovitals.com/recovery/emergency-rollback \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "triggeredBy": "oncall-engineer",
    "reason": "Complete system outage - rolling back to last known good state"
  }'

# Monitor rollback progress
curl https://api.holovitals.com/recovery/status
```

#### Option 2: Service Restart (If rollback unavailable - 5 minutes)

```bash
# Restart all services
ssh admin@production-server
sudo systemctl restart holovitals-api
sudo systemctl restart holovitals-worker
sudo systemctl restart holovitals-scheduler

# Verify services started
systemctl status holovitals-*

# Check health
curl https://api.holovitals.com/health
```

#### Option 3: Full System Restore (Last resort - 15 minutes)

```bash
# Get latest snapshot
curl https://api.holovitals.com/snapshots?environment=PRODUCTION&limit=1

# Trigger full restore
curl -X POST https://api.holovitals.com/recovery/restore \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "snapshotId": "snapshot_id_here",
    "type": "FULL_RESTORE",
    "triggeredBy": "oncall-engineer",
    "triggerReason": "Complete system outage - full restore required",
    "isEmergency": true
  }'

# Monitor restore progress
watch -n 5 'curl https://api.holovitals.com/recovery/status'
```

### Validation Steps

1. **Verify System Health**
   ```bash
   # Check all services
   curl https://api.holovitals.com/health/system
   
   # Expected: {"status": "HEALTHY", "services": [...]}
   ```

2. **Test Critical Endpoints**
   ```bash
   # Test authentication
   curl -X POST https://api.holovitals.com/auth/login \
     -d '{"email": "test@example.com", "password": "test"}'
   
   # Test patient data access
   curl https://api.holovitals.com/patients/test-patient-id \
     -H "Authorization: Bearer $TOKEN"
   
   # Test AI analysis
   curl https://api.holovitals.com/ai/analyze \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"documentId": "test-doc-id"}'
   ```

3. **Monitor for 30 Minutes**
   ```bash
   # Watch error rates
   watch -n 10 'curl https://api.holovitals.com/metrics/errors'
   
   # Watch response times
   watch -n 10 'curl https://api.holovitals.com/metrics/performance'
   ```

### Communication Plan

**Internal Communication:**
- Update #incidents channel every 5 minutes
- Update incident ticket with progress
- Notify team when resolved

**External Communication:**
- Update status page: "Investigating major outage"
- After 15 minutes: "We are experiencing a system-wide outage. Our team is working to restore service."
- When resolved: "Service has been restored. We apologize for the inconvenience."

### Post-Incident Actions

1. **Document Timeline**
   - Time of detection
   - Time of acknowledgment
   - Actions taken
   - Time of resolution
   - Total downtime

2. **Create Post-Mortem**
   - Root cause analysis
   - Timeline of events
   - What went well
   - What could be improved
   - Action items

3. **Update Runbook**
   - Add any new learnings
   - Update procedures if needed
   - Add preventive measures

---

## 2. Database Connection Failure

**Severity:** SEV1 - CRITICAL  
**Response Time:** Immediate  
**Escalation:** Database Admin, Technical Lead

### Detection Criteria
- Database connection errors in logs
- "Cannot connect to database" errors
- Connection pool exhausted
- Timeout errors on database queries

### Immediate Actions

1. **Check Database Status**
   ```bash
   # Test connection
   psql -h db.holovitals.com -U admin -d holovitals -c "SELECT 1;"
   
   # Check if database is running
   pg_isready -h db.holovitals.com
   ```

2. **Check Connection Pool**
   ```bash
   # Check active connections
   psql -h db.holovitals.com -U admin -d holovitals -c \
     "SELECT count(*) FROM pg_stat_activity;"
   
   # Check max connections
   psql -h db.holovitals.com -U admin -d holovitals -c \
     "SHOW max_connections;"
   ```

### Resolution Procedures

#### If Database is Down:

```bash
# Restart database
ssh admin@db-server
sudo systemctl restart postgresql

# Verify startup
sudo systemctl status postgresql
```

#### If Connection Pool Exhausted:

```bash
# Increase connection pool size
# Edit application config
vim /etc/holovitals/config.yml

# Update:
database:
  pool_size: 50  # Increase from 20
  
# Restart application
sudo systemctl restart holovitals-api
```

#### If Network Issue:

```bash
# Check network connectivity
ping db.holovitals.com

# Check firewall rules
sudo iptables -L

# Test port connectivity
telnet db.holovitals.com 5432
```

### Validation

```bash
# Test database queries
psql -h db.holovitals.com -U admin -d holovitals -c \
  "SELECT * FROM users LIMIT 1;"

# Check application logs
tail -f /var/log/holovitals/app.log | grep "database"
```

---

## 3. AI Service Unavailable

**Severity:** SEV2 - HIGH  
**Response Time:** < 15 minutes  
**Escalation:** AI Team Lead

### Detection Criteria
- AI analysis requests timing out
- OpenAI API errors
- AI service health check failing
- Document analysis failures

### Immediate Actions

1. **Check AI Service Status**
   ```bash
   # Check service health
   curl https://api.holovitals.com/health/ai-service
   
   # Check OpenAI API status
   curl https://status.openai.com/api/v2/status.json
   ```

2. **Check API Keys**
   ```bash
   # Verify API key is set
   echo $OPENAI_API_KEY
   
   # Test API key
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### Resolution Procedures

#### If OpenAI API is Down:

```bash
# Switch to fallback AI service
# Update configuration
curl -X POST https://api.holovitals.com/config/ai \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "provider": "fallback",
    "enabled": true
  }'
```

#### If Rate Limited:

```bash
# Check rate limit status
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Implement request queuing
curl -X POST https://api.holovitals.com/config/ai \
  -d '{
    "rate_limit": {
      "enabled": true,
      "requests_per_minute": 50
    }
  }'
```

#### If Service Crashed:

```bash
# Restart AI service
ssh admin@production-server
sudo systemctl restart holovitals-ai-worker

# Check logs
journalctl -u holovitals-ai-worker -n 100
```

### Validation

```bash
# Test AI analysis
curl -X POST https://api.holovitals.com/ai/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "documentId": "test-doc-id",
    "analysisType": "medical"
  }'
```

---

## 4. Authentication System Down

**Severity:** SEV1 - CRITICAL  
**Response Time:** Immediate  
**Escalation:** Security Team, Technical Lead

### Detection Criteria
- Users cannot log in
- Authentication API returning errors
- JWT validation failures
- MFA service unavailable

### Immediate Actions

1. **Check Auth Service**
   ```bash
   # Check service status
   curl https://api.holovitals.com/health/auth
   
   # Test login endpoint
   curl -X POST https://api.holovitals.com/auth/login \
     -d '{"email": "test@example.com", "password": "test"}'
   ```

2. **Check Dependencies**
   ```bash
   # Check database connection
   psql -h db.holovitals.com -U admin -d holovitals -c \
     "SELECT * FROM users LIMIT 1;"
   
   # Check Redis (session store)
   redis-cli -h cache.holovitals.com ping
   ```

### Resolution Procedures

#### If Service Crashed:

```bash
# Restart auth service
sudo systemctl restart holovitals-auth

# Check logs
journalctl -u holovitals-auth -n 100
```

#### If Database Issue:

```bash
# Check users table
psql -h db.holovitals.com -U admin -d holovitals -c \
  "SELECT count(*) FROM users;"

# Rebuild indexes if needed
psql -h db.holovitals.com -U admin -d holovitals -c \
  "REINDEX TABLE users;"
```

#### If Session Store Issue:

```bash
# Restart Redis
ssh admin@cache-server
sudo systemctl restart redis

# Clear corrupted sessions
redis-cli -h cache.holovitals.com FLUSHDB
```

### Validation

```bash
# Test full authentication flow
# 1. Login
TOKEN=$(curl -X POST https://api.holovitals.com/auth/login \
  -d '{"email": "test@example.com", "password": "test"}' \
  | jq -r '.token')

# 2. Verify token
curl https://api.holovitals.com/auth/verify \
  -H "Authorization: Bearer $TOKEN"

# 3. Test MFA
curl -X POST https://api.holovitals.com/auth/mfa/verify \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"code": "123456"}'
```

---

## 5. Data Corruption Detected

**Severity:** SEV1 - CRITICAL  
**Response Time:** Immediate  
**Escalation:** CTO, Compliance Officer, Database Admin

### Detection Criteria
- Data integrity checks failing
- Inconsistent data across tables
- Foreign key violations
- Checksum mismatches

### Immediate Actions

1. **Stop All Write Operations**
   ```bash
   # Enable read-only mode
   curl -X POST https://api.holovitals.com/config/maintenance \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "mode": "read_only",
       "reason": "Data corruption investigation"
     }'
   ```

2. **Create Emergency Snapshot**
   ```bash
   # Snapshot current state
   curl -X POST https://api.holovitals.com/snapshots \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "type": "FULL_SYSTEM",
       "name": "Emergency - Data Corruption",
       "reason": "Preserve state before corruption fix"
     }'
   ```

3. **Assess Damage**
   ```bash
   # Run integrity checks
   psql -h db.holovitals.com -U admin -d holovitals -c \
     "SELECT * FROM check_data_integrity();"
   
   # Check affected tables
   psql -h db.holovitals.com -U admin -d holovitals -c \
     "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
   ```

### Resolution Procedures

#### If Recent Corruption:

```bash
# Restore from latest snapshot
curl -X POST https://api.holovitals.com/recovery/restore \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "snapshotId": "latest_good_snapshot_id",
    "type": "DATABASE_RESTORE",
    "triggeredBy": "dba",
    "triggerReason": "Data corruption - restoring to last known good state"
  }'
```

#### If Specific Table Corrupted:

```bash
# Restore specific table
pg_restore -h db.holovitals.com -U admin -d holovitals \
  -t affected_table /backups/latest.dump

# Rebuild indexes
psql -h db.holovitals.com -U admin -d holovitals -c \
  "REINDEX TABLE affected_table;"
```

### Validation

```bash
# Run full integrity check
psql -h db.holovitals.com -U admin -d holovitals -c \
  "SELECT * FROM check_data_integrity();"

# Verify data consistency
psql -h db.holovitals.com -U admin -d holovitals -c \
  "SELECT * FROM verify_referential_integrity();"
```

### Post-Incident

1. **Notify Compliance**
   - Document affected data
   - Identify affected patients
   - Prepare breach notification if needed

2. **Root Cause Analysis**
   - Identify corruption source
   - Implement preventive measures
   - Update data validation

---

## 6. Security Breach Response

**Severity:** SEV1 - CRITICAL  
**Response Time:** Immediate  
**Escalation:** CISO, CTO, Legal, Compliance

### Detection Criteria
- Unauthorized access detected
- Suspicious activity patterns
- Security alerts triggered
- Data exfiltration detected

### Immediate Actions

1. **Contain Breach**
   ```bash
   # Block suspicious IPs
   curl -X POST https://api.holovitals.com/security/block-ip \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "ips": ["suspicious.ip.address"],
       "reason": "Security breach containment"
     }'
   
   # Revoke all active sessions
   curl -X POST https://api.holovitals.com/auth/revoke-all-sessions \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Preserve Evidence**
   ```bash
   # Create forensic snapshot
   curl -X POST https://api.holovitals.com/snapshots \
     -d '{
       "type": "FULL_SYSTEM",
       "name": "Forensic - Security Breach",
       "reason": "Preserve evidence for investigation"
     }'
   
   # Export access logs
   curl https://api.holovitals.com/logs/access?format=json > access_logs.json
   ```

3. **Notify Authorities**
   - Contact CISO immediately
   - Notify legal team
   - Contact law enforcement if needed
   - Prepare for HIPAA breach notification

### Investigation Steps

1. **Identify Breach Scope**
   ```bash
   # Check access logs
   grep "suspicious_ip" /var/log/holovitals/access.log
   
   # Check affected accounts
   psql -h db.holovitals.com -U admin -d holovitals -c \
     "SELECT * FROM access_logs WHERE ip = 'suspicious_ip';"
   ```

2. **Assess Data Exposure**
   ```bash
   # Check accessed resources
   psql -h db.holovitals.com -U admin -d holovitals -c \
     "SELECT DISTINCT resource_id FROM access_logs 
      WHERE ip = 'suspicious_ip' AND action = 'READ';"
   ```

### Resolution

1. **Patch Vulnerability**
2. **Reset Credentials**
3. **Implement Additional Security**
4. **Monitor for Continued Activity**

---

## 7. HIPAA Compliance Violation

**Severity:** SEV1 - CRITICAL  
**Response Time:** Immediate  
**Escalation:** Compliance Officer, Legal, CTO

### Detection Criteria
- Unauthorized PHI access
- PHI transmitted insecurely
- Audit log tampering
- Consent violations

### Immediate Actions

1. **Stop Violation**
2. **Document Incident**
3. **Notify Compliance Officer**
4. **Preserve Evidence**

### Investigation

1. **Identify Affected Patients**
2. **Assess Breach Scope**
3. **Determine Notification Requirements**

### Resolution

1. **Implement Corrective Measures**
2. **Notify Affected Individuals (if required)**
3. **Report to HHS (if required)**
4. **Update Policies and Procedures**

---

## 8. Performance Degradation

**Severity:** SEV2 - HIGH  
**Response Time:** < 15 minutes  
**Escalation:** Performance Team

### Detection Criteria
- Response times > 2 seconds
- High CPU/memory usage
- Database query slowdowns
- User complaints

### Immediate Actions

1. **Identify Bottleneck**
   ```bash
   # Check system resources
   top
   
   # Check database performance
   psql -h db.holovitals.com -U admin -d holovitals -c \
     "SELECT * FROM pg_stat_activity WHERE state = 'active';"
   ```

2. **Quick Fixes**
   ```bash
   # Clear cache
   redis-cli -h cache.holovitals.com FLUSHALL
   
   # Restart workers
   sudo systemctl restart holovitals-worker
   ```

### Resolution

1. **Optimize Queries**
2. **Scale Resources**
3. **Implement Caching**
4. **Load Balance**

---

## Emergency Contacts

- **On-Call Engineer:** +1-XXX-XXX-XXXX
- **Technical Lead:** +1-XXX-XXX-XXXX
- **CTO:** +1-XXX-XXX-XXXX
- **CISO:** +1-XXX-XXX-XXXX
- **Compliance Officer:** +1-XXX-XXX-XXXX

## Escalation Matrix

| Severity | Response Time | Escalation Path |
|----------|--------------|-----------------|
| SEV1 | Immediate | On-call → Tech Lead → CTO |
| SEV2 | < 15 min | On-call → Tech Lead |
| SEV3 | < 1 hour | On-call |
| SEV4 | < 4 hours | Team Lead |

---

**Last Updated:** 2025-01-15  
**Version:** 1.0  
**Owner:** DevOps Team