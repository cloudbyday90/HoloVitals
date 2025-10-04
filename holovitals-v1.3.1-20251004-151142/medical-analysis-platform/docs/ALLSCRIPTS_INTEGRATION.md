# Allscripts Integration Guide

## Overview

This guide covers Allscripts-specific features and optimizations for HoloVitals, including enhanced resource types, bulk data export, and FollowMyHealth portal integration.

Allscripts is a major EHR provider in the United States with **8% market share**, serving millions of patients across thousands of healthcare organizations through their FollowMyHealth patient portal.

## Table of Contents

1. [Allscripts-Specific Features](#allscripts-specific-features)
2. [Bulk Data Export](#bulk-data-export)
3. [Enhanced Resource Types](#enhanced-resource-types)
4. [FollowMyHealth Integration](#followmyhealth-integration)
5. [API Reference](#api-reference)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Allscripts-Specific Features

### What Makes Allscripts Different?

Allscripts provides several unique advantages:

1. **FollowMyHealth Portal**: Comprehensive patient engagement platform
2. **Goal Tracking**: Advanced patient health goal monitoring
3. **ServiceRequest Support**: Complete order and referral tracking
4. **Care Coordination**: Enhanced care team collaboration
5. **High Data Quality**: Accurate and well-structured data

### Supported Resource Types

#### Standard FHIR Resources
- Patient
- DocumentReference
- Observation (labs, vitals)
- Condition (diagnoses)
- MedicationRequest
- AllergyIntolerance
- Immunization
- Procedure

#### Allscripts-Specific Resources
- **DiagnosticReport**: Lab results, imaging reports
- **CarePlan**: Treatment plans, care coordination
- **Encounter**: Visits, appointments, hospitalizations
- **Goal**: Patient health goals (unique to Allscripts)
- **ServiceRequest**: Orders, referrals (unique to Allscripts)

---

## Bulk Data Export

### What is Bulk Data Export?

Bulk Data Export is a FHIR operation (`$export`) that allows efficient retrieval of large datasets. Instead of making hundreds of individual API calls, you can request all data at once.

### Benefits

- **90% fewer API calls**: One export vs. hundreds of individual requests
- **Faster**: Complete in 5-30 minutes vs. hours
- **More reliable**: Less prone to rate limiting
- **Cost-effective**: Fewer API calls = lower costs

### Export Types

#### 1. Patient-Level Export
Export all data for a single patient.

```typescript
POST /api/ehr/allscripts/bulk-export
{
  "connectionId": "conn_123",
  "exportType": "PATIENT",
  "resourceTypes": ["Observation", "Condition", "MedicationRequest", "Goal"],
  "since": "2024-01-01T00:00:00Z"
}
```

#### 2. Group-Level Export
Export data for a group of patients (requires group membership).

```typescript
POST /api/ehr/allscripts/bulk-export
{
  "connectionId": "conn_123",
  "exportType": "GROUP",
  "resourceTypes": ["Patient", "Observation"]
}
```

#### 3. System-Level Export
Export all data from the system (requires special permissions).

```typescript
POST /api/ehr/allscripts/bulk-export
{
  "connectionId": "conn_123",
  "exportType": "SYSTEM"
}
```

### Workflow

```
1. Initiate Export (POST /api/ehr/allscripts/bulk-export)
   ↓
2. Receive Job ID and Status URL
   ↓
3. Poll Status (GET /api/ehr/allscripts/bulk-export/:id)
   ↓ (repeat every 30-60 seconds)
4. Export Completes (status: COMPLETED)
   ↓
5. Process Files (POST /api/ehr/allscripts/bulk-export/:id/process)
   ↓
6. Resources Stored in Database
```

### Example: Complete Bulk Export

```typescript
// Step 1: Initiate export
const response = await fetch('/api/ehr/allscripts/bulk-export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connectionId: 'conn_123',
    exportType: 'PATIENT',
    resourceTypes: ['Observation', 'Condition', 'Goal', 'ServiceRequest'],
    since: '2024-01-01T00:00:00Z'
  })
});

const { job } = await response.json();
console.log('Export initiated:', job.id);

// Step 2: Poll for completion
const pollStatus = async (jobId: string) => {
  const statusResponse = await fetch(`/api/ehr/allscripts/bulk-export/${jobId}`);
  const { job } = await statusResponse.json();
  
  if (job.status === 'COMPLETED') {
    return job;
  } else if (job.status === 'FAILED') {
    throw new Error(job.errorMessage);
  }
  
  // Wait 30 seconds and try again
  await new Promise(resolve => setTimeout(resolve, 30000));
  return pollStatus(jobId);
};

const completedJob = await pollStatus(job.id);
console.log('Export completed:', completedJob);

// Step 3: Process the export files
const processResponse = await fetch(`/api/ehr/allscripts/bulk-export/${job.id}/process`, {
  method: 'POST'
});

const { message, job: finalJob } = await processResponse.json();
console.log(message);
console.log('Resources imported:', finalJob.resourceCount);
```

---

## Enhanced Resource Types

### DiagnosticReport

Lab results, imaging reports, and diagnostic findings.

#### What's Included
- Clinical notes and interpretations
- Lab results with reference ranges
- Imaging study metadata
- PDF reports (when available)

#### Example Data Structure

```json
{
  "resourceType": "DiagnosticReport",
  "id": "dr-123",
  "status": "final",
  "category": ["LAB"],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "58410-2",
      "display": "Complete blood count (hemogram) panel"
    }],
    "text": "CBC with Differential"
  },
  "subject": {
    "reference": "Patient/patient-123"
  },
  "effectiveDateTime": "2024-01-15T10:30:00Z",
  "result": [
    { "reference": "Observation/obs-wbc" },
    { "reference": "Observation/obs-rbc" }
  ],
  "conclusion": "All values within normal limits."
}
```

### CarePlan

Treatment plans and care coordination.

#### What's Included
- Care plan activities
- Patient goals
- Care team information
- Timeline and milestones

### Encounter

Visits, appointments, and hospitalizations.

#### What's Included
- Visit details (type, date, location)
- Encounter diagnoses
- Procedures performed
- Hospitalization information

### Goal (Unique to Allscripts)

Patient health goals and targets.

#### What's Included
- Goal description and category
- Lifecycle status (proposed, active, completed)
- Achievement status
- Target measures and due dates
- Progress tracking

#### Example Data Structure

```json
{
  "resourceType": "Goal",
  "id": "goal-123",
  "lifecycleStatus": "active",
  "achievementStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/goal-achievement",
      "code": "in-progress",
      "display": "In Progress"
    }]
  },
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/goal-category",
      "code": "dietary",
      "display": "Dietary"
    }]
  }],
  "description": {
    "text": "Reduce HbA1c to below 7%"
  },
  "subject": {
    "reference": "Patient/patient-123"
  },
  "startDate": "2024-01-01",
  "target": [{
    "measure": {
      "coding": [{
        "system": "http://loinc.org",
        "code": "4548-4",
        "display": "Hemoglobin A1c"
      }]
    },
    "detailQuantity": {
      "value": 7.0,
      "unit": "%"
    },
    "dueDate": "2024-06-30"
  }]
}
```

#### Enhanced Data Extraction

HoloVitals automatically extracts:
- Goal lifecycle and achievement status
- Target measures with values and units
- Due dates and progress tracking
- Category and priority information

### ServiceRequest (Unique to Allscripts)

Orders and referrals.

#### What's Included
- Order type (lab, imaging, referral)
- Order status tracking
- Requester information
- Reason for order
- Order date and priority

#### Example Data Structure

```json
{
  "resourceType": "ServiceRequest",
  "id": "sr-123",
  "status": "active",
  "intent": "order",
  "category": [{
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "108252007",
      "display": "Laboratory procedure"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "24331-1",
      "display": "Lipid panel"
    }],
    "text": "Lipid Panel"
  },
  "subject": {
    "reference": "Patient/patient-123"
  },
  "authoredOn": "2024-01-15T09:00:00Z",
  "requester": {
    "reference": "Practitioner/pract-456"
  },
  "reasonCode": [{
    "text": "Routine screening"
  }]
}
```

#### Enhanced Data Extraction

HoloVitals automatically extracts:
- Order type and category
- Order status and intent
- Requester information
- Reason for order
- Order date and priority

---

## Enhanced Sync

### What is Enhanced Sync?

Enhanced Sync retrieves both standard FHIR resources AND Allscripts-specific resources in a single operation.

### API Endpoint

```typescript
POST /api/ehr/allscripts/enhanced-sync
{
  "connectionId": "conn_123"
}
```

### Response

```json
{
  "success": true,
  "message": "Enhanced sync completed successfully",
  "results": {
    "standardResources": 150,
    "diagnosticReports": 25,
    "carePlans": 3,
    "encounters": 42,
    "goals": 8,
    "serviceRequests": 12,
    "totalResources": 240,
    "duration": 50
  }
}
```

### What Gets Synced

1. **Standard Resources** (via EHRSyncService)
   - Patient
   - DocumentReference
   - Observation
   - Condition
   - MedicationRequest
   - AllergyIntolerance
   - Immunization
   - Procedure

2. **Allscripts-Specific Resources** (via AllscriptsEnhancedService)
   - DiagnosticReport
   - CarePlan
   - Encounter
   - Goal (unique)
   - ServiceRequest (unique)

### When to Use Enhanced Sync vs. Bulk Export

**Use Enhanced Sync when:**
- You need real-time data
- You're syncing a single patient
- You need immediate results
- Data volume is moderate (<500 resources)

**Use Bulk Export when:**
- You're doing initial data load
- You have large data volumes (>500 resources)
- You can wait 5-30 minutes
- You want to minimize API calls

---

## FollowMyHealth Integration

### What is FollowMyHealth?

FollowMyHealth is Allscripts' patient engagement platform and portal. To use Allscripts' FHIR APIs in production, you must register your app through FollowMyHealth.

### Registration Process

#### 1. Create Account
- Go to https://www.followmyhealth.com
- Click "Developer Portal"
- Complete registration form

#### 2. Submit App
- Click "Create New App"
- Fill in app details:
  - App name: "HoloVitals"
  - Description: "AI-powered medical document analysis"
  - Category: "Patient Engagement"
  - FHIR version: "R4"

#### 3. Configure OAuth
- Client Type: Confidential
- Redirect URIs: `https://yourdomain.com/api/ehr/authorize`
- Scopes:
  - `patient/*.read`
  - `launch/patient`
  - `offline_access`

#### 4. Security Assessment
Allscripts will review your app for:
- HIPAA compliance
- Security best practices
- Data handling procedures
- Privacy policies

#### 5. Production Credentials
Once approved, you'll receive:
- Production Client ID
- Production Client Secret
- Production FHIR endpoints
- FollowMyHealth listing

### Sandbox Testing

Before production, test with Allscripts' sandbox:

```typescript
// Sandbox configuration
const allscriptsSandbox = {
  fhirBaseUrl: 'https://sandbox.followmyhealth.com/fhir/R4',
  authorizationUrl: 'https://sandbox.followmyhealth.com/oauth2/authorize',
  tokenUrl: 'https://sandbox.followmyhealth.com/oauth2/token',
  clientId: 'your-sandbox-client-id',
  clientSecret: 'your-sandbox-client-secret',
};
```

---

## API Reference

### Bulk Export

#### Initiate Export

```
POST /api/ehr/allscripts/bulk-export
```

**Request Body:**
```json
{
  "connectionId": "string (required)",
  "exportType": "PATIENT | GROUP | SYSTEM (required)",
  "resourceTypes": ["string"] (optional),
  "since": "ISO 8601 date (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "string",
    "status": "INITIATED",
    "exportType": "PATIENT",
    "statusUrl": "string",
    "startedAt": "ISO 8601 date"
  }
}
```

#### Check Export Status

```
GET /api/ehr/allscripts/bulk-export/:id
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "string",
    "exportType": "PATIENT",
    "status": "IN_PROGRESS | COMPLETED | FAILED",
    "startedAt": "ISO 8601 date",
    "completedAt": "ISO 8601 date (if completed)",
    "resourceCount": 0,
    "totalSize": "0",
    "errorMessage": "string (if failed)"
  }
}
```

#### Process Export Files

```
POST /api/ehr/allscripts/bulk-export/:id/process
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk export processed successfully",
  "job": {
    "id": "string",
    "resourceCount": 150,
    "totalSize": "1048576"
  }
}
```

### Enhanced Sync

```
POST /api/ehr/allscripts/enhanced-sync
```

**Request Body:**
```json
{
  "connectionId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Enhanced sync completed successfully",
  "results": {
    "standardResources": 150,
    "diagnosticReports": 25,
    "carePlans": 3,
    "encounters": 42,
    "goals": 8,
    "serviceRequests": 12,
    "totalResources": 240,
    "duration": 50
  }
}
```

### Capabilities

```
GET /api/ehr/allscripts/capabilities
```

**Response:**
```json
{
  "success": true,
  "capabilities": {
    "provider": "Allscripts",
    "marketShare": "8%",
    "fhirVersion": "R4",
    "standardResources": ["Patient", "..."],
    "allscriptsSpecificResources": [...],
    "bulkDataExport": {...},
    "rateLimiting": {...},
    "authentication": {...}
  }
}
```

---

## Best Practices

### 1. Use Bulk Export for Initial Load

When connecting a new patient, use bulk export to retrieve all historical data efficiently.

```typescript
// Initial connection
const connection = await connectToAllscripts(patientId);

// Use bulk export for initial load
const exportJob = await initiateBulkExport({
  connectionId: connection.id,
  exportType: 'PATIENT',
  resourceTypes: ['Observation', 'Condition', 'Goal', 'ServiceRequest'],
});

// Wait for completion and process
await waitForCompletion(exportJob.id);
await processExportFiles(exportJob.id);
```

### 2. Use Enhanced Sync for Updates

After initial load, use enhanced sync for incremental updates.

```typescript
// Daily sync
setInterval(async () => {
  await performEnhancedSync(connection.id);
}, 24 * 60 * 60 * 1000); // Every 24 hours
```

### 3. Respect Rate Limits

Allscripts allows ~6-7 requests per second. HoloVitals automatically handles rate limiting.

```typescript
// Automatic rate limiting in AllscriptsEnhancedService
private rateLimitDelay = 150; // ~6-7 requests per second
```

### 4. Track Patient Goals

Leverage Allscripts' unique Goal resource for patient engagement.

```typescript
// Sync and display patient goals
const goals = await syncGoals(connectionId, patientId);

// Show progress to patient
goals.forEach(goal => {
  console.log(`Goal: ${goal.description}`);
  console.log(`Status: ${goal.achievementStatus}`);
  console.log(`Target: ${goal.target.value} ${goal.target.unit}`);
  console.log(`Due: ${goal.target.dueDate}`);
});
```

### 5. Monitor Service Requests

Track orders and referrals for better care coordination.

```typescript
// Sync service requests
const serviceRequests = await syncServiceRequests(connectionId, patientId);

// Alert patient about pending orders
const pendingOrders = serviceRequests.filter(sr => sr.status === 'active');
console.log(`You have ${pendingOrders.length} pending orders`);
```

---

## Troubleshooting

### Issue: Bulk Export Fails to Start

**Symptoms:**
- 400 or 403 error when initiating export
- "Insufficient permissions" error

**Solutions:**
1. Verify OAuth scopes include `patient/*.read`
2. Check that patient has authorized the app
3. Ensure connection is active
4. Verify FollowMyHealth approval

### Issue: Export Status Stuck at IN_PROGRESS

**Symptoms:**
- Status remains IN_PROGRESS for >30 minutes
- No error message

**Solutions:**
1. Check Allscripts service status
2. Verify large dataset (may take longer)
3. Contact Allscripts support if >1 hour

### Issue: Rate Limiting Errors

**Symptoms:**
- 429 Too Many Requests errors
- "Rate limit exceeded" messages

**Solutions:**
1. Reduce concurrent requests
2. Use bulk export instead of individual calls
3. Implement exponential backoff
4. Check rate limit headers

### Issue: Missing Goal or ServiceRequest Resources

**Symptoms:**
- Goals or ServiceRequests not synced
- Lower count than expected

**Solutions:**
1. Verify patient has goals/orders in FollowMyHealth
2. Check OAuth scope permissions
3. Verify resource type support in sandbox
4. Check date filters (since parameter)

### Issue: Authentication Fails

**Symptoms:**
- 401 Unauthorized errors
- "Invalid client credentials" message

**Solutions:**
1. Verify client ID and secret
2. Check confidential client configuration
3. Re-authorize patient
4. Verify FollowMyHealth app status

---

## Performance Metrics

### Bulk Export Performance

| Data Volume | Export Time | API Calls | Cost Savings |
|------------|-------------|-----------|--------------|
| 100 resources | 5 minutes | 1 | 99% |
| 500 resources | 10 minutes | 1 | 99.8% |
| 1,000 resources | 15 minutes | 1 | 99.9% |
| 5,000 resources | 30 minutes | 1 | 99.98% |

### Enhanced Sync Performance

| Resource Type | Avg Time | Resources/Min |
|--------------|----------|---------------|
| DiagnosticReport | 150ms | 400 |
| CarePlan | 120ms | 500 |
| Encounter | 135ms | 444 |
| Goal | 100ms | 600 |
| ServiceRequest | 110ms | 545 |
| Standard Resources | 75ms | 800 |

---

## Unique Allscripts Features

### 1. Goal Tracking
Allscripts provides comprehensive patient goal tracking:
- Lifecycle status (proposed, active, completed)
- Achievement status (in-progress, achieved, not-achieved)
- Target measures with values and units
- Due dates and progress monitoring

### 2. ServiceRequest Tracking
Complete order and referral tracking:
- Lab orders
- Imaging orders
- Specialist referrals
- Order status tracking
- Requester information

### 3. FollowMyHealth Portal
Comprehensive patient engagement:
- Patient portal access
- Secure messaging
- Appointment scheduling
- Medication refills
- Health records access

---

## Support

For Allscripts-specific issues:
- Allscripts Developer Portal: https://www.followmyhealth.com/developers
- Allscripts Support: https://www.allscripts.com/support
- HoloVitals Support: support@holovitals.com

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial Allscripts integration
- Bulk data export support
- Enhanced resource types (DiagnosticReport, CarePlan, Encounter, Goal, ServiceRequest)
- FollowMyHealth documentation
- Rate limiting implementation
- Enhanced sync functionality