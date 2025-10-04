# HoloVitals EHR Integration System

## Overview

The HoloVitals EHR Integration System enables patients to automatically retrieve their medical records from healthcare providers using FHIR (Fast Healthcare Interoperability Resources) APIs. This system is inspired by Fasten-OnPrem and supports SMART on FHIR authentication for secure, patient-authorized access to EHR data.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Supported EHR Systems](#supported-ehr-systems)
3. [FHIR Resources](#fhir-resources)
4. [Authentication Flow](#authentication-flow)
5. [Data Synchronization](#data-synchronization)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Setup Guide](#setup-guide)
9. [Security & Compliance](#security--compliance)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    HoloVitals Platform                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              EHR Integration Layer                    │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │ FHIR Client  │  │ SMART Auth   │  │ Sync Engine│ │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │         EHR Connection Service                    │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Database Layer                           │  │
│  │  - EHR Connections                                    │  │
│  │  - FHIR Resources                                     │  │
│  │  - Sync History                                       │  │
│  │  - Provider Configurations                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ FHIR R4 + SMART on FHIR
                            │
┌─────────────────────────────────────────────────────────────┐
│                    EHR Systems                               │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Epic    │  │  Cerner  │  │Allscripts│  │  Others  │   │
│  │ MyChart  │  │  Oracle  │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

1. **SMART on FHIR Authentication**: Industry-standard OAuth2-based authentication
2. **Multi-Provider Support**: Connect to Epic, Cerner, and 100+ healthcare systems
3. **Automatic Synchronization**: Background sync with configurable frequency
4. **Document Retrieval**: Download PDFs and clinical documents
5. **Incremental Sync**: Only fetch new/updated data
6. **Cost Integration**: Automatic token estimation and deduction
7. **HIPAA Compliant**: Encrypted storage, audit logging, secure transmission

---

## Supported EHR Systems

### Primary Providers

| Provider | Status | FHIR Version | Document Support |
|----------|--------|--------------|------------------|
| Epic (MyChart) | ✅ Supported | R4 | ✅ Yes |
| Cerner/Oracle Health | ✅ Supported | R4 | ✅ Yes |
| Allscripts | ✅ Supported | R4 | ✅ Yes |
| athenahealth | ✅ Supported | R4 | ✅ Yes |
| eClinicalWorks | ✅ Supported | R4 | ✅ Yes |
| NextGen | ✅ Supported | R4 | ✅ Yes |

### Additional Providers

The system supports 100+ healthcare organizations through standardized FHIR R4 endpoints. Any provider that implements SMART on FHIR can be integrated.

---

## FHIR Resources

### Supported Resource Types

The system can retrieve the following FHIR resource types:

1. **Patient** - Patient demographics and identifiers
2. **DocumentReference** - Clinical documents (PDFs, CCDAs, etc.)
3. **Observation** - Lab results, vital signs, measurements
4. **Condition** - Diagnoses and health conditions
5. **MedicationRequest** - Prescriptions and medication orders
6. **AllergyIntolerance** - Allergies and adverse reactions
7. **Immunization** - Vaccination records
8. **Procedure** - Surgical procedures and interventions
9. **DiagnosticReport** - Lab reports and imaging results
10. **CarePlan** - Treatment plans and care coordination

### Document Types

The system can download and process:
- **PDF documents** (discharge summaries, reports, letters)
- **CCD/CCDA documents** (Continuity of Care Documents)
- **Lab reports** (PDF or structured data)
- **Imaging reports** (radiology, pathology)
- **Clinical notes** (progress notes, consultation notes)

---

## Authentication Flow

### SMART on FHIR OAuth2 Flow

```
┌──────────┐                                      ┌──────────┐
│          │                                      │          │
│  Patient │                                      │   EHR    │
│          │                                      │  System  │
└────┬─────┘                                      └────┬─────┘
     │                                                 │
     │  1. Initiate Connection                        │
     ├────────────────────────────────────────────────┤
     │                                                 │
     │  2. Redirect to EHR Authorization              │
     │◄────────────────────────────────────────────────┤
     │                                                 │
     │  3. Patient Logs In & Authorizes               │
     ├────────────────────────────────────────────────►│
     │                                                 │
     │  4. Authorization Code                          │
     │◄────────────────────────────────────────────────┤
     │                                                 │
     │  5. Exchange Code for Access Token             │
     ├────────────────────────────────────────────────►│
     │                                                 │
     │  6. Access Token + Refresh Token               │
     │◄────────────────────────────────────────────────┤
     │                                                 │
     │  7. Fetch Patient Data                         │
     ├────────────────────────────────────────────────►│
     │                                                 │
     │  8. FHIR Resources                             │
     │◄────────────────────────────────────────────────┤
     │                                                 │
```

### Step-by-Step Process

1. **Initiate Connection**
   - User selects healthcare provider
   - System creates connection record
   - Generates authorization URL with PKCE

2. **User Authorization**
   - User redirected to EHR login page
   - User authenticates with EHR credentials
   - User authorizes HoloVitals to access their data

3. **Token Exchange**
   - EHR redirects back with authorization code
   - System exchanges code for access token
   - Tokens encrypted and stored securely

4. **Data Retrieval**
   - System uses access token to fetch FHIR resources
   - Data stored in local database
   - Documents downloaded and processed

---

## Data Synchronization

### Sync Types

1. **Full Sync**
   - Retrieves all available data
   - Used for initial connection
   - Can be manually triggered

2. **Incremental Sync**
   - Only fetches new/updated resources
   - Uses `_lastUpdated` parameter
   - Runs automatically on schedule

### Sync Process

```
1. Check Connection Status
   ├─ Active? Continue
   └─ Expired? Refresh token

2. Create Sync History Record
   └─ Status: QUEUED

3. For Each Resource Type:
   ├─ Query FHIR Server
   ├─ Parse Resources
   ├─ Save to Database
   └─ Download Documents (if applicable)

4. Update Sync History
   ├─ Resources Created/Updated
   ├─ Documents Downloaded
   ├─ Tokens Used
   └─ Status: COMPLETED

5. Schedule Next Sync
   └─ Based on sync frequency
```

### Sync Frequency

- **Default**: Every 24 hours
- **Configurable**: 1 hour to 7 days
- **Manual**: Can be triggered anytime
- **Smart Scheduling**: Avoids peak hours

---

## API Reference

### Connection Management

#### Initiate Connection

```http
POST /api/ehr/connect
Content-Type: application/json

{
  "userId": "user-123",
  "provider": "EPIC",
  "providerName": "Kaiser Permanente",
  "fhirBaseUrl": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
  "authorizationUrl": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
  "tokenUrl": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
  "clientId": "your-client-id",
  "redirectUri": "https://holovitals.com/ehr/callback"
}

Response:
{
  "success": true,
  "connection": { ... },
  "authorizationUrl": "https://fhir.epic.com/...",
  "state": "random-state-value"
}
```

#### Complete Authorization

```http
POST /api/ehr/authorize
Content-Type: application/json

{
  "connectionId": "conn-123",
  "code": "authorization-code",
  "state": "random-state-value",
  "codeVerifier": "pkce-code-verifier"
}

Response:
{
  "success": true,
  "connection": {
    "id": "conn-123",
    "status": "ACTIVE",
    "patientId": "patient-456",
    "patientName": "John Doe"
  }
}
```

#### List Connections

```http
GET /api/ehr/connections?userId=user-123

Response:
{
  "success": true,
  "connections": [
    {
      "id": "conn-123",
      "provider": "EPIC",
      "providerName": "Kaiser Permanente",
      "status": "ACTIVE",
      "patientName": "John Doe",
      "lastSyncAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### Disconnect Connection

```http
DELETE /api/ehr/connections?connectionId=conn-123

Response:
{
  "success": true,
  "message": "Connection disconnected successfully"
}
```

### Synchronization

#### Start Sync

```http
POST /api/ehr/sync
Content-Type: application/json

{
  "connectionId": "conn-123",
  "syncType": "incremental",
  "downloadDocuments": true
}

Response:
{
  "success": true,
  "syncId": "sync-456",
  "message": "Sync started successfully"
}
```

#### Get Sync Status

```http
GET /api/ehr/sync?syncId=sync-456

Response:
{
  "success": true,
  "sync": {
    "id": "sync-456",
    "status": "SYNCING",
    "resourcesQueried": 150,
    "resourcesCreated": 45,
    "documentsDownloaded": 12,
    "startedAt": "2025-01-15T10:30:00Z"
  }
}
```

#### Get Sync History

```http
GET /api/ehr/sync?connectionId=conn-123

Response:
{
  "success": true,
  "history": [
    {
      "id": "sync-456",
      "status": "COMPLETED",
      "resourcesCreated": 45,
      "duration": 120,
      "completedAt": "2025-01-15T10:32:00Z"
    }
  ]
}
```

### Resources

#### Get Synced Resources

```http
GET /api/ehr/resources?connectionId=conn-123&resourceType=DocumentReference&limit=50

Response:
{
  "success": true,
  "resources": [
    {
      "id": "res-789",
      "resourceType": "DOCUMENT_REFERENCE",
      "title": "Discharge Summary",
      "date": "2025-01-10T00:00:00Z",
      "contentType": "application/pdf",
      "documentDownloaded": true
    }
  ],
  "total": 150,
  "hasMore": true
}
```

---

## Database Schema

### EHRConnection

Stores connection information and OAuth tokens.

```sql
CREATE TABLE ehr_connections (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  provider VARCHAR NOT NULL,
  provider_name VARCHAR NOT NULL,
  fhir_base_url VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  patient_id VARCHAR,
  patient_name VARCHAR,
  auto_sync BOOLEAN DEFAULT true,
  sync_frequency INT DEFAULT 24,
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### FHIRResource

Stores raw FHIR resources and extracted metadata.

```sql
CREATE TABLE fhir_resources (
  id UUID PRIMARY KEY,
  connection_id UUID NOT NULL,
  resource_type VARCHAR NOT NULL,
  fhir_id VARCHAR NOT NULL,
  raw_data TEXT NOT NULL,
  title VARCHAR,
  description TEXT,
  date TIMESTAMP,
  category VARCHAR,
  status VARCHAR,
  content_type VARCHAR,
  content_url TEXT,
  document_downloaded BOOLEAN DEFAULT false,
  local_file_path VARCHAR,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(connection_id, fhir_id, resource_type)
);
```

### SyncHistory

Tracks synchronization operations and metrics.

```sql
CREATE TABLE sync_history (
  id UUID PRIMARY KEY,
  connection_id UUID NOT NULL,
  status VARCHAR NOT NULL,
  sync_type VARCHAR DEFAULT 'incremental',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration INT,
  resources_queried INT DEFAULT 0,
  resources_created INT DEFAULT 0,
  resources_updated INT DEFAULT 0,
  documents_downloaded INT DEFAULT 0,
  total_bytes_downloaded BIGINT DEFAULT 0,
  tokens_estimated INT,
  tokens_used INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Setup Guide

### Prerequisites

1. **Epic Sandbox Account** (for testing)
   - Register at: https://fhir.epic.com/
   - Create a patient-facing app
   - Get client ID and configure redirect URI

2. **Environment Variables**

```env
# Encryption key for OAuth tokens (32 bytes)
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# Epic Configuration (Sandbox)
EPIC_CLIENT_ID=your-epic-client-id
EPIC_REDIRECT_URI=http://localhost:3000/ehr/callback

# Production URLs (replace with actual)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

1. **Install Dependencies**

```bash
npm install fhir-kit-client simple-oauth2 axios
```

2. **Run Database Migration**

```bash
npx prisma db push
npx prisma generate
```

3. **Test Connection**

```bash
# Start development server
npm run dev

# Test Epic sandbox connection
curl -X POST http://localhost:3000/api/ehr/connect \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "provider": "EPIC",
    "providerName": "Epic Sandbox",
    "fhirBaseUrl": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
    "authorizationUrl": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
    "tokenUrl": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
    "clientId": "your-client-id",
    "redirectUri": "http://localhost:3000/ehr/callback"
  }'
```

### Epic Sandbox Testing

1. **Test Patients Available**:
   - Derrick Lin (Patient ID: eVgg3VZXq3V3FLezRJOQBgw3)
   - Camila Lopez (Patient ID: erXuFYUfucBZaryVksYEcMg3)

2. **Test Credentials**:
   - Username: fhirderrick / fhircamila
   - Password: epicepic1

3. **Test Flow**:
   - Initiate connection
   - Visit authorization URL
   - Login with test credentials
   - Authorize access
   - Complete callback

---

## Security & Compliance

### Data Protection

1. **Encryption at Rest**
   - OAuth tokens encrypted with AES-256-GCM
   - Encryption key stored in environment variables
   - Never log or expose tokens

2. **Encryption in Transit**
   - All API calls use HTTPS
   - TLS 1.2 or higher required
   - Certificate validation enforced

3. **Token Management**
   - Automatic token refresh
   - Secure token storage
   - Token expiration handling
   - Revocation support

### HIPAA Compliance

1. **Access Controls**
   - User authentication required
   - Connection ownership verified
   - Role-based access control

2. **Audit Logging**
   - All data access logged
   - Sync operations tracked
   - Connection changes recorded

3. **Data Retention**
   - Configurable retention policies
   - Secure data deletion
   - Backup and recovery

4. **Business Associate Agreement (BAA)**
   - Required with EHR providers
   - Document data handling
   - Incident response procedures

### Best Practices

1. **Token Security**
   - Never expose tokens in logs
   - Rotate encryption keys regularly
   - Use secure random generation

2. **Error Handling**
   - Sanitize error messages
   - No PHI in error logs
   - Graceful degradation

3. **Rate Limiting**
   - Respect EHR rate limits
   - Implement exponential backoff
   - Queue sync operations

4. **Monitoring**
   - Track sync success rates
   - Monitor token expiration
   - Alert on failures

---

## Troubleshooting

### Common Issues

#### "Token expired and no refresh token available"

**Solution**: User needs to re-authorize the connection.

```typescript
// Disconnect and reconnect
await EHRConnectionService.disconnectConnection(connectionId);
// User must go through authorization flow again
```

#### "Failed to download document"

**Possible causes**:
- Document not available
- Insufficient permissions
- Network timeout

**Solution**: Check document availability and retry.

#### "Sync failed with 429 Too Many Requests"

**Solution**: Implement rate limiting and exponential backoff.

```typescript
// Retry with exponential backoff
const delay = Math.pow(2, retryCount) * 1000;
await new Promise(resolve => setTimeout(resolve, delay));
```

---

## Future Enhancements

1. **Additional Providers**
   - MEDITECH
   - Practice Fusion
   - Greenway Health

2. **Advanced Features**
   - Real-time notifications
   - Webhook support
   - Bulk data export (FHIR Bulk Data)

3. **Analytics**
   - Health timeline visualization
   - Trend analysis
   - Predictive insights

4. **Integration**
   - HL7 v2 support
   - Direct messaging
   - CDS Hooks

---

## Support

For questions or issues:
- **Documentation**: `/docs/EHR_INTEGRATION.md`
- **API Reference**: See above
- **Epic Support**: https://fhir.epic.com/
- **SMART on FHIR**: http://docs.smarthealthit.org/

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Phase 1 Complete