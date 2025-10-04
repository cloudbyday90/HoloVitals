# Multi-Provider EHR Support

## Overview

HoloVitals now supports **6 major EHR providers** covering over **79% of the US healthcare market**. Each provider has a dedicated connector with provider-specific optimizations and features.

---

## Supported Providers

### 1. Epic (MyChart) - 31% Market Share ✅

**Status**: Fully Supported  
**Patient Portal**: MyChart  
**Sandbox**: Available

**Features:**
- Complete FHIR R4 support
- DocumentReference for PDFs
- DiagnosticReport support
- CarePlan support
- Bulk data export

**Setup:**
1. Register at: https://fhir.epic.com/Developer/Apps
2. Get client ID
3. Configure redirect URI
4. No client secret required (public client)

**Test Credentials:**
- Sandbox URL: https://fhir.epic.com/
- Username: fhirderrick / fhircamila
- Password: epicepic1

---

### 2. Cerner/Oracle Health - 25% Market Share ✅

**Status**: Fully Supported  
**Patient Portal**: HealtheLife  
**Sandbox**: Available

**Features:**
- Complete FHIR R4 support
- Multi-tenant architecture
- DocumentReference support
- Observation and lab results
- Medication and allergy data

**Setup:**
1. Register at: https://code-console.cerner.com/
2. Get client ID and tenant ID
3. Configure redirect URI
4. No client secret required

**Special Requirements:**
- Requires tenant ID in URLs
- Tenant-specific FHIR endpoints

**Sandbox Tenant ID:**
- `ec2458f2-1e24-41c8-b71b-0e701af7583d`

---

### 3. Allscripts - 8% Market Share ✅

**Status**: Fully Supported  
**Patient Portal**: FollowMyHealth  
**Sandbox**: Available

**Features:**
- FHIR R4 support
- DocumentReference support
- Clinical data retrieval
- Patient demographics

**Setup:**
1. Register at: https://developer.allscripts.com/
2. Get client ID and client secret
3. Configure redirect URI
4. **Requires client secret** (confidential client)

**Special Requirements:**
- Client secret required
- OAuth2 confidential client flow

---

### 4. athenahealth - 6% Market Share ✅

**Status**: Fully Supported  
**Patient Portal**: athenaPatient  
**Sandbox**: Available

**Features:**
- FHIR R4 support
- DocumentReference support
- Observation data
- Medication and allergy data

**Setup:**
1. Register at: https://developer.athenahealth.com/
2. Get client ID and client secret
3. Configure redirect URI
4. **Requires client secret**

**Special Requirements:**
- Client secret required
- Rate limiting: 40 requests/minute

---

### 5. eClinicalWorks - 5% Market Share ✅

**Status**: Fully Supported  
**Patient Portal**: Patient Portal V11  
**Sandbox**: Available

**Features:**
- FHIR R4 support
- DocumentReference support
- Clinical data retrieval
- Patient demographics

**Setup:**
1. Contact eClinicalWorks for API access
2. Get client ID and client secret
3. Configure redirect URI
4. **Requires client secret**

**Special Requirements:**
- Client secret required
- Rate limiting: 30 requests/minute

---

### 6. NextGen Healthcare - 4% Market Share ✅

**Status**: Fully Supported  
**Patient Portal**: NextGen Patient Portal  
**Sandbox**: Available

**Features:**
- FHIR R4 support
- DocumentReference support
- Clinical data retrieval
- Patient demographics

**Setup:**
1. Register at: https://developer.nextgen.com/
2. Get client ID and client secret
3. Configure redirect URI
4. **Requires client secret**

**Special Requirements:**
- Client secret required
- Rate limiting: 30 requests/minute

---

## Provider Comparison

| Provider | Market Share | Sandbox | Client Secret | Rate Limit (req/min) | Bulk Data |
|----------|--------------|---------|---------------|---------------------|-----------|
| Epic | 31% | ✅ Yes | ❌ No | 60 | ✅ Yes |
| Cerner | 25% | ✅ Yes | ❌ No | 60 | ✅ Yes |
| Allscripts | 8% | ✅ Yes | ✅ Yes | 30 | ❌ No |
| athenahealth | 6% | ✅ Yes | ✅ Yes | 40 | ❌ No |
| eClinicalWorks | 5% | ✅ Yes | ✅ Yes | 30 | ❌ No |
| NextGen | 4% | ✅ Yes | ✅ Yes | 30 | ❌ No |

**Total Market Coverage: 79%**

---

## Architecture

### Connector Framework

```
┌─────────────────────────────────────────────────────────┐
│              ConnectorFactory                            │
│  (Creates provider-specific connectors)                 │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│EpicConnector │ │CernerConnector│ │AllscriptsConn│
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │  BaseEHRConnector    │
            │  (Abstract base)     │
            └──────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ FHIRClient   │ │SMARTAuthSvc  │ │ProviderConfig│
└──────────────┘ └──────────────┘ └──────────────┘
```

### Base Connector Features

All connectors inherit from `BaseEHRConnector` and provide:

1. **OAuth2 Authentication**
   - SMART on FHIR with PKCE
   - Automatic token refresh
   - Secure token storage

2. **FHIR Operations**
   - Patient data retrieval
   - Resource queries
   - Document download
   - Pagination handling

3. **Error Handling**
   - Retry logic
   - Rate limit handling
   - Connection validation

4. **Provider-Specific Customization**
   - Custom scopes
   - URL modifications
   - Special parameters
   - Resource mappings

---

## Usage Examples

### 1. Create a Connector

```typescript
import { ConnectorFactory } from '@/lib/connectors/ConnectorFactory';
import { EHRProvider } from '@/lib/config/ehr-providers';

// Epic connector
const epicConnector = ConnectorFactory.createConnector({
  provider: EHRProvider.EPIC,
  clientId: 'your-epic-client-id',
  redirectUri: 'https://holovitals.com/ehr/callback',
  useSandbox: true,
});

// Cerner connector with tenant ID
const cernerConnector = ConnectorFactory.createConnector({
  provider: EHRProvider.CERNER,
  clientId: 'your-cerner-client-id',
  redirectUri: 'https://holovitals.com/ehr/callback',
  tenantId: 'your-tenant-id',
  useSandbox: true,
});

// Allscripts connector (requires client secret)
const allscriptsConnector = ConnectorFactory.createConnector({
  provider: EHRProvider.ALLSCRIPTS,
  clientId: 'your-allscripts-client-id',
  clientSecret: 'your-allscripts-client-secret',
  redirectUri: 'https://holovitals.com/ehr/callback',
  useSandbox: true,
});
```

### 2. Generate Authorization URL

```typescript
const result = await connector.generateAuthorizationUrl();

console.log('Authorization URL:', result.authorizationUrl);
console.log('State:', result.state);
console.log('Code Verifier:', result.codeVerifier);

// Redirect user to authorization URL
window.location.href = result.authorizationUrl;
```

### 3. Exchange Code for Token

```typescript
// After user authorizes and returns with code
const tokenResponse = await connector.getAccessToken(
  authorizationCode,
  codeVerifier
);

console.log('Access Token:', tokenResponse.accessToken);
console.log('Refresh Token:', tokenResponse.refreshToken);
console.log('Patient ID:', tokenResponse.patientId);
```

### 4. Create FHIR Client and Fetch Data

```typescript
const fhirClient = connector.createFHIRClient(tokenResponse.accessToken);

// Get patient data
const patientData = await connector.getPatientData(
  fhirClient,
  tokenResponse.patientId
);

console.log('Patient:', patientData.patient);
console.log('Documents:', patientData.documentReferences);
console.log('Observations:', patientData.observations);
console.log('Conditions:', patientData.conditions);
```

---

## Provider Discovery

### List All Providers

```typescript
import { ProviderDiscoveryService } from '@/lib/services/ProviderDiscoveryService';

// Get all supported providers
const providers = await ProviderDiscoveryService.getSupportedProviders();

// Get popular providers (sorted by market share)
const popular = await ProviderDiscoveryService.getPopularProviders();

// Search providers
const results = await ProviderDiscoveryService.searchProvidersByName('epic');
```

### API Endpoint

```http
GET /api/ehr/providers

Query Parameters:
- search: Search by name
- popular: Get popular providers (sorted by market share)
- includeSandbox: Include sandbox configurations
- includeDisabled: Include disabled providers

Response:
{
  "success": true,
  "providers": [
    {
      "id": "EPIC",
      "displayName": "Epic",
      "description": "Epic Systems - Leading EHR provider",
      "marketShare": 31,
      "patientPortalName": "MyChart",
      "capabilities": { ... }
    }
  ],
  "total": 6
}
```

---

## Provider-Specific Notes

### Epic

**Strengths:**
- Largest market share
- Excellent documentation
- Robust sandbox
- Bulk data support

**Considerations:**
- Requires 'aud' parameter in authorization
- Some resources require additional scopes

### Cerner/Oracle Health

**Strengths:**
- Second largest market share
- Good FHIR support
- Multi-tenant architecture

**Considerations:**
- Requires tenant ID
- URLs contain tenant-specific paths
- Different endpoints per organization

### Allscripts

**Strengths:**
- Good ambulatory EHR coverage
- Solid FHIR implementation

**Considerations:**
- Requires client secret
- Confidential client flow
- Lower rate limits

### athenahealth

**Strengths:**
- Cloud-native platform
- Good API documentation

**Considerations:**
- Requires client secret
- Moderate rate limits (40/min)

### eClinicalWorks

**Strengths:**
- Popular in ambulatory settings
- Good patient portal

**Considerations:**
- Requires client secret
- API access requires approval
- Lower rate limits (30/min)

### NextGen

**Strengths:**
- Solid ambulatory EHR
- Good FHIR support

**Considerations:**
- Requires client secret
- Lower rate limits (30/min)

---

## Testing

### Sandbox Testing

All 6 providers offer sandbox environments for testing:

1. **Epic Sandbox**
   - URL: https://fhir.epic.com/
   - Test patients available
   - Full FHIR R4 support

2. **Cerner Sandbox**
   - URL: https://fhir-ehr-code.cerner.com/
   - Tenant ID: ec2458f2-1e24-41c8-b71b-0e701af7583d
   - Test data available

3. **Allscripts Sandbox**
   - URL: https://fhir-sandbox.allscripts.com/
   - Requires registration

4. **athenahealth Sandbox**
   - URL: https://api.preview.platform.athenahealth.com/
   - Requires registration

5. **eClinicalWorks Sandbox**
   - URL: https://fhir-sandbox.eclinicalworks.com/
   - Requires approval

6. **NextGen Sandbox**
   - URL: https://fhir.nextgen.com/nge/sandbox/
   - Requires registration

---

## Rate Limiting

Each provider has different rate limits:

| Provider | Requests/Minute | Requests/Hour |
|----------|----------------|---------------|
| Epic | 60 | 1,000 |
| Cerner | 60 | 1,000 |
| Allscripts | 30 | 500 |
| athenahealth | 40 | 800 |
| eClinicalWorks | 30 | 600 |
| NextGen | 30 | 500 |

**Best Practices:**
- Implement exponential backoff
- Queue requests during sync
- Monitor rate limit headers
- Use bulk data APIs when available

---

## Future Providers

### Planned Support

1. **MEDITECH** - 3% market share
2. **Practice Fusion** - 2% market share
3. **Greenway Health** - 2% market share
4. **ModMed** - 1% market share
5. **DrChrono** - 1% market share

**Total Potential Coverage: 88%**

---

## Support

For provider-specific questions:
- **Epic**: https://fhir.epic.com/
- **Cerner**: https://fhir.cerner.com/
- **Allscripts**: https://developer.allscripts.com/
- **athenahealth**: https://docs.athenahealth.com/
- **eClinicalWorks**: Contact vendor
- **NextGen**: https://developer.nextgen.com/

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Providers Supported**: 6  
**Market Coverage**: 79%