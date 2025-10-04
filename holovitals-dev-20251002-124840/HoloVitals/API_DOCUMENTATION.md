# HoloVitals EHR API Documentation

## Overview

The HoloVitals EHR API provides a comprehensive interface for integrating with 7 major EHR systems, covering over 75% of the U.S. hospital market. All endpoints are RESTful, use JSON for request/response bodies, and require authentication.

## Base URL

```
Production: https://api.holovitals.com
Development: http://localhost:3000/api
```

## Authentication

All API endpoints require authentication using NextAuth session tokens. Include the session token in your requests.

```javascript
// Example using fetch
const response = await fetch('/api/ehr/connect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include session cookie
  body: JSON.stringify(data),
});
```

## Rate Limiting

- **Default Limit:** 100 requests per minute per IP/user
- **Headers:** Rate limit information is included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": [] // Optional: validation errors or additional info
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `207` - Multi-Status (partial success)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Endpoints

### 1. Connect to EHR System

Establishes a connection to an EHR system for a patient.

**Endpoint:** `POST /api/ehr/connect`

**Request Body:**
```json
{
  "patientId": "uuid",
  "provider": "EPIC" | "CERNER" | "MEDITECH" | "ATHENAHEALTH" | "ECLINICALWORKS" | "ALLSCRIPTS" | "NEXTGEN",
  "config": {
    "baseUrl": "https://fhir.epic.com",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "additionalConfig": {
      "environment": "production",
      "tenantId": "optional-tenant-id"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to EPIC",
  "data": {
    "patientId": "uuid",
    "provider": "EPIC",
    "connectedAt": "2025-01-01T12:00:00Z"
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/ehr/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    patientId: '123e4567-e89b-12d3-a456-426614174000',
    provider: 'EPIC',
    config: {
      baseUrl: 'https://fhir.epic.com',
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  }),
});

const data = await response.json();
```

---

### 2. Get Connection Status

Retrieves the current EHR connection status for a patient.

**Endpoint:** `GET /api/ehr/connect?patientId={uuid}`

**Query Parameters:**
- `patientId` (required): Patient UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "provider": "EPIC",
    "lastSyncedAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 3. Search Patients

Searches for patients in the connected EHR system.

**Endpoint:** `GET /api/ehr/patients/search`

**Query Parameters:**
- `patientId` (required): Patient UUID (for connection context)
- `firstName` (optional): Patient first name
- `lastName` (optional): Patient last name
- `dateOfBirth` (optional): Date of birth (YYYY-MM-DD)
- `mrn` (optional): Medical record number

**Note:** At least one search criterion (firstName, lastName, dateOfBirth, or mrn) is required.

**Response:**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "epic-patient-id",
        "ehrProvider": "EPIC",
        "ehrPatientId": "epic-patient-id",
        "mrn": "12345678",
        "firstName": "John",
        "lastName": "Doe",
        "dateOfBirth": "1980-01-01",
        "gender": "male",
        "phone": "+1-555-0100",
        "email": "john.doe@example.com",
        "address": {
          "line1": "123 Main St",
          "city": "Boston",
          "state": "MA",
          "zip": "02101",
          "country": "US"
        }
      }
    ],
    "count": 1
  }
}
```

**Example:**
```javascript
const response = await fetch(
  '/api/ehr/patients/search?patientId=123e4567-e89b-12d3-a456-426614174000&firstName=John&lastName=Doe',
  {
    credentials: 'include',
  }
);

const data = await response.json();
```

---

### 4. Sync Patient Data

Synchronizes all patient data from the EHR system.

**Endpoint:** `POST /api/ehr/patients/:patientId/sync`

**URL Parameters:**
- `patientId`: Patient UUID

**Request Body:**
```json
{
  "ehrPatientId": "epic-patient-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patientId": "uuid",
    "ehrPatientId": "epic-patient-id",
    "ehrProvider": "EPIC",
    "recordsProcessed": {
      "encounters": 15,
      "observations": 42,
      "medications": 8,
      "allergies": 3,
      "total": 68
    },
    "syncedAt": "2025-01-01T12:00:00Z",
    "errors": []
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/ehr/patients/123e4567-e89b-12d3-a456-426614174000/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    ehrPatientId: 'epic-patient-id',
  }),
});

const data = await response.json();
```

---

### 5. Get Sync History

Retrieves the sync history for a patient.

**Endpoint:** `GET /api/ehr/patients/:patientId/sync`

**URL Parameters:**
- `patientId`: Patient UUID

**Query Parameters:**
- `limit` (optional, default: 10): Number of records to return
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "syncHistory": [
      {
        "id": "sync-id",
        "patientId": "uuid",
        "provider": "EPIC",
        "status": "SUCCESS",
        "recordsProcessed": 68,
        "startedAt": "2025-01-01T12:00:00Z",
        "completedAt": "2025-01-01T12:01:30Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 6. Get Patient Encounters

Retrieves patient encounters from the EHR system.

**Endpoint:** `GET /api/ehr/patients/:patientId/encounters`

**URL Parameters:**
- `patientId`: Patient UUID

**Query Parameters:**
- `ehrPatientId` (required): EHR-specific patient ID
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `status` (optional): Filter by status (e.g., "finished", "in-progress")

**Response:**
```json
{
  "success": true,
  "data": {
    "encounters": [
      {
        "id": "encounter-id",
        "ehrProvider": "EPIC",
        "patientId": "epic-patient-id",
        "type": "Office Visit",
        "status": "finished",
        "startDate": "2024-12-15T10:00:00Z",
        "endDate": "2024-12-15T10:30:00Z",
        "location": "Main Clinic",
        "provider": {
          "id": "provider-id",
          "name": "Dr. Jane Smith"
        },
        "diagnoses": [
          {
            "code": "J06.9",
            "description": "Acute upper respiratory infection"
          }
        ]
      }
    ],
    "count": 1
  }
}
```

---

### 7. Get Patient Medications

Retrieves patient medications from the EHR system.

**Endpoint:** `GET /api/ehr/patients/:patientId/medications`

**URL Parameters:**
- `patientId`: Patient UUID

**Query Parameters:**
- `ehrPatientId` (required): EHR-specific patient ID
- `status` (optional): Filter by status (e.g., "active", "completed")

**Response:**
```json
{
  "success": true,
  "data": {
    "medications": [
      {
        "id": "medication-id",
        "ehrProvider": "EPIC",
        "patientId": "epic-patient-id",
        "medicationCode": "197361",
        "medicationName": "Lisinopril 10 MG Oral Tablet",
        "dosage": "10 mg",
        "route": "Oral",
        "frequency": "Once daily",
        "status": "active",
        "startDate": "2024-01-01T00:00:00Z"
      }
    ],
    "count": 1
  }
}
```

---

### 8. Get Patient Lab Results

Retrieves patient lab results from the EHR system.

**Endpoint:** `GET /api/ehr/patients/:patientId/labs`

**URL Parameters:**
- `patientId`: Patient UUID

**Query Parameters:**
- `ehrPatientId` (required): EHR-specific patient ID
- `category` (optional, default: "laboratory"): Observation category
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "labResults": [
      {
        "id": "observation-id",
        "ehrProvider": "EPIC",
        "patientId": "epic-patient-id",
        "code": "2345-7",
        "display": "Glucose",
        "category": "laboratory",
        "value": 95,
        "unit": "mg/dL",
        "effectiveDateTime": "2024-12-15T08:00:00Z",
        "status": "final"
      }
    ],
    "count": 1
  }
}
```

---

### 9. Get Patient Allergies

Retrieves patient allergies from the EHR system.

**Endpoint:** `GET /api/ehr/patients/:patientId/allergies`

**URL Parameters:**
- `patientId`: Patient UUID

**Query Parameters:**
- `ehrPatientId` (required): EHR-specific patient ID

**Response:**
```json
{
  "success": true,
  "data": {
    "allergies": [
      {
        "id": "allergy-id",
        "ehrProvider": "EPIC",
        "patientId": "epic-patient-id",
        "substance": "Penicillin",
        "reaction": "Hives",
        "severity": "moderate",
        "status": "active"
      }
    ],
    "count": 1
  }
}
```

---

### 10. Disconnect from EHR

Disconnects from the EHR system for a patient.

**Endpoint:** `DELETE /api/ehr/disconnect`

**Request Body:**
```json
{
  "patientId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully disconnected from EHR",
  "data": {
    "patientId": "uuid",
    "disconnectedAt": "2025-01-01T12:00:00Z"
  }
}
```

---

## Supported EHR Providers

| Provider | Market Share | Status |
|----------|--------------|--------|
| Epic Systems | 41.3% | ✅ Supported |
| Oracle Cerner | 21.8% | ✅ Supported |
| MEDITECH | 11.9% | ✅ Supported |
| athenahealth | 1.1% | ✅ Supported |
| eClinicalWorks | - | ✅ Supported |
| Allscripts/Veradigm | - | ✅ Supported |
| NextGen Healthcare | - | ✅ Supported |

**Total Coverage: 75%+ of U.S. hospitals**

---

## Provider-Specific Configuration

### Epic
```json
{
  "baseUrl": "https://fhir.epic.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "additionalConfig": {
    "environment": "production"
  }
}
```

### Oracle Cerner
```json
{
  "baseUrl": "https://fhir.cerner.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "additionalConfig": {
    "tenantId": "your-tenant-id",
    "environment": "production"
  }
}
```

### MEDITECH
```json
{
  "baseUrl": "https://fhir.meditech.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "additionalConfig": {
    "facilityId": "your-facility-id",
    "environment": "production"
  }
}
```

### athenahealth
```json
{
  "baseUrl": "https://api.athenahealth.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "additionalConfig": {
    "practiceId": "your-practice-id",
    "environment": "production"
  }
}
```

### eClinicalWorks
```json
{
  "baseUrl": "https://api.eclinicalworks.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "additionalConfig": {
    "practiceId": "your-practice-id",
    "environment": "production"
  }
}
```

### Allscripts/Veradigm
```json
{
  "baseUrl": "https://api.veradigm.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "additionalConfig": {
    "appName": "your-app-name",
    "platform": "touchworks",
    "environment": "production"
  }
}
```

### NextGen Healthcare
```json
{
  "baseUrl": "https://api.nextgen.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "additionalConfig": {
    "practiceId": "your-practice-id",
    "environment": "production"
  }
}
```

---

## Best Practices

### 1. Error Handling
Always check the `success` field in responses and handle errors appropriately:

```javascript
const response = await fetch('/api/ehr/connect', options);
const data = await response.json();

if (!data.success) {
  console.error('Error:', data.error, data.message);
  // Handle error
}
```

### 2. Rate Limiting
Implement exponential backoff when rate limited:

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await new Promise(resolve => setTimeout(resolve, (retryAfter || 60) * 1000));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}
```

### 3. Pagination
Use pagination for large datasets:

```javascript
async function fetchAllSyncHistory(patientId) {
  let allHistory = [];
  let offset = 0;
  const limit = 50;
  
  while (true) {
    const response = await fetch(
      `/api/ehr/patients/${patientId}/sync?limit=${limit}&offset=${offset}`,
      { credentials: 'include' }
    );
    
    const data = await response.json();
    allHistory = [...allHistory, ...data.data.syncHistory];
    
    if (!data.data.pagination.hasMore) break;
    offset += limit;
  }
  
  return allHistory;
}
```

### 4. Caching
Cache EHR data appropriately to reduce API calls:

```javascript
const cache = new Map();

async function getCachedData(key, fetchFn, ttl = 300000) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}
```

---

## Security Considerations

1. **Never expose credentials** in client-side code
2. **Use HTTPS** for all API calls in production
3. **Implement CSRF protection** for state-changing operations
4. **Validate all input** on both client and server
5. **Log all PHI access** for HIPAA compliance
6. **Encrypt sensitive data** at rest and in transit
7. **Implement proper session management**
8. **Use rate limiting** to prevent abuse

---

## Support

For API support:
- **Documentation:** See this file and EHR_INTEGRATIONS_COMPLETE.md
- **Issues:** Create an issue on GitHub
- **Email:** support@holovitals.com

---

**Last Updated:** 2025-01-01
**API Version:** 1.0.0
**Status:** Production Ready