# Medical Standardization Repository API Reference

## Overview

The Medical Standardization Repository API provides endpoints for standardizing medical data using LOINC codes, converting units, validating lab results, and accessing reference ranges.

## Base URL

```
/api/medical-standards
```

## Authentication

All endpoints require authentication. Include the user's JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Search LOINC Codes

Search for LOINC codes by various criteria.

**Endpoint:** `GET /api/medical-standards/loinc`

**Query Parameters:**
- `query` (string, optional): Search term (searches component, commonName, shortName)
- `category` (string, optional): LOINC category (LABORATORY, CLINICAL, SURVEY, etc.)
- `componentType` (string, optional): Component type (CHEMISTRY, HEMATOLOGY, etc.)
- `component` (string, optional): Component name
- `system` (string, optional): System (e.g., "Ser/Plas", "Bld")
- `limit` (number, optional): Results per page (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Example Request:**
```bash
GET /api/medical-standards/loinc?query=glucose&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "codes": [
      {
        "id": "clxxx",
        "loincNumber": "2345-7",
        "component": "Glucose",
        "property": "MCnc",
        "timeAspect": "Pt",
        "system": "Ser/Plas",
        "scale": "Qn",
        "category": "LABORATORY",
        "componentType": "CHEMISTRY",
        "commonName": "Glucose",
        "shortName": "Glucose SerPl",
        "longName": "Glucose [Mass/volume] in Serum or Plasma",
        "relatedNames": ["Blood Sugar", "Blood Glucose"],
        "status": "ACTIVE",
        "units": [
          {
            "id": "clyyy",
            "unit": "mg/dL",
            "ucumCode": "mg/dL",
            "unitSystem": "CONVENTIONAL",
            "isPrimary": true
          },
          {
            "id": "clzzz",
            "unit": "mmol/L",
            "ucumCode": "mmol/L",
            "unitSystem": "SI",
            "conversionFactor": 0.0555,
            "isPrimary": false
          }
        ],
        "referenceRanges": [
          {
            "id": "clwww",
            "type": "NORMAL",
            "lowValue": 70,
            "highValue": 100,
            "unit": "mg/dL",
            "gender": "ALL",
            "source": "Mayo Clinic"
          }
        ]
      }
    ],
    "total": 1
  }
}
```

---

### 2. Get LOINC Code Details

Get detailed information for a specific LOINC code.

**Endpoint:** `GET /api/medical-standards/loinc/:loincNumber`

**Path Parameters:**
- `loincNumber` (string): LOINC code (e.g., "2345-7")

**Example Request:**
```bash
GET /api/medical-standards/loinc/2345-7
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "loincNumber": "2345-7",
    "component": "Glucose",
    "commonName": "Glucose",
    "longName": "Glucose [Mass/volume] in Serum or Plasma",
    "category": "LABORATORY",
    "componentType": "CHEMISTRY",
    "units": [...],
    "referenceRanges": [...]
  }
}
```

---

### 3. Standardize Lab Result

Standardize a single lab result using LOINC codes.

**Endpoint:** `POST /api/medical-standards/standardize`

**Request Body:**
```json
{
  "loincNumber": "2345-7",
  "value": 100,
  "unit": "mg/dL",
  "patientAge": 45,
  "patientGender": "MALE",
  "condition": "Fasting"
}
```

**Fields:**
- `loincNumber` (string, required): LOINC code
- `value` (number, required): Lab result value
- `unit` (string, required): Unit of measurement
- `patientAge` (number, optional): Patient age in years
- `patientGender` (string, optional): MALE, FEMALE, OTHER
- `condition` (string, optional): Special condition (e.g., "Fasting", "Pregnant")

**Example Response:**
```json
{
  "success": true,
  "data": {
    "originalValue": 100,
    "standardizedValue": 100,
    "loincCode": {
      "loincNumber": "2345-7",
      "commonName": "Glucose",
      "longName": "Glucose [Mass/volume] in Serum or Plasma"
    },
    "unit": {
      "unit": "mg/dL",
      "ucumCode": "mg/dL",
      "unitSystem": "CONVENTIONAL",
      "isPrimary": true
    },
    "referenceRange": {
      "type": "NORMAL",
      "lowValue": 70,
      "highValue": 100,
      "unit": "mg/dL",
      "gender": "ALL"
    },
    "isWithinRange": true,
    "interpretation": "Within normal range",
    "flags": []
  }
}
```

**Interpretation Values:**
- `"Within normal range"`: Value is normal
- `"Below normal range"`: Value is low
- `"Above normal range"`: Value is high
- `"Critically low value"`: Value is critically low
- `"Critically high value"`: Value is critically high

**Flags:**
- `"LOW"`: Below normal range
- `"HIGH"`: Above normal range
- `"CRITICAL"`: Critically abnormal

---

### 4. Batch Standardize Lab Results

Standardize multiple lab results at once.

**Endpoint:** `POST /api/medical-standards/standardize/batch`

**Request Body:**
```json
{
  "results": [
    {
      "loincNumber": "2345-7",
      "value": 100,
      "unit": "mg/dL",
      "patientAge": 45,
      "patientGender": "MALE"
    },
    {
      "loincNumber": "2951-2",
      "value": 140,
      "unit": "mEq/L",
      "patientAge": 45,
      "patientGender": "MALE"
    }
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "originalValue": 100,
        "standardizedValue": 100,
        "loincCode": {...},
        "unit": {...},
        "referenceRange": {...},
        "isWithinRange": true,
        "interpretation": "Within normal range",
        "flags": []
      },
      {
        "originalValue": 140,
        "standardizedValue": 140,
        "loincCode": {...},
        "unit": {...},
        "referenceRange": {...},
        "isWithinRange": true,
        "interpretation": "Within normal range",
        "flags": []
      }
    ],
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

---

### 5. Validate Lab Result

Validate a lab result against LOINC standards.

**Endpoint:** `POST /api/medical-standards/validate`

**Request Body:**
```json
{
  "loincNumber": "2345-7",
  "testName": "Glucose",
  "value": 100,
  "unit": "mg/dL",
  "patientAge": 45,
  "patientGender": "MALE"
}
```

**Fields:**
- `loincNumber` (string, optional): LOINC code (either this or testName required)
- `testName` (string, optional): Test name (either this or loincNumber required)
- `value` (any, required): Lab result value
- `unit` (string, optional): Unit of measurement
- `patientAge` (number, optional): Patient age in years
- `patientGender` (string, optional): MALE, FEMALE, OTHER

**Example Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "loincCode": {
      "loincNumber": "2345-7",
      "commonName": "Glucose",
      "longName": "Glucose [Mass/volume] in Serum or Plasma"
    },
    "errors": [],
    "warnings": [],
    "suggestions": []
  }
}
```

**Validation Errors:**
- Missing LOINC code
- Invalid unit for test
- Invalid value type (e.g., text for quantitative test)

**Validation Warnings:**
- Non-standard unit
- Multiple LOINC codes found for test name

---

### 6. Convert Units

Convert between different units for a lab result.

**Endpoint:** `POST /api/medical-standards/convert`

**Request Body:**
```json
{
  "loincNumber": "2345-7",
  "value": 100,
  "fromUnit": "mg/dL",
  "toUnit": "mmol/L"
}
```

**Fields:**
- `loincNumber` (string, required): LOINC code
- `value` (number, required): Value to convert
- `fromUnit` (string, required): Source unit
- `toUnit` (string, required): Target unit

**Example Response:**
```json
{
  "success": true,
  "data": {
    "originalValue": 100,
    "originalUnit": "mg/dL",
    "convertedValue": 5.55,
    "convertedUnit": "mmol/L"
  }
}
```

---

### 7. Get Popular LOINC Codes

Get popular LOINC codes by category.

**Endpoint:** `GET /api/medical-standards/popular`

**Query Parameters:**
- `category` (string, optional): LOINC category (default: LABORATORY)
- `limit` (number, optional): Number of codes to return (default: 20)

**Example Request:**
```bash
GET /api/medical-standards/popular?category=LABORATORY&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "category": "LABORATORY",
    "codes": [
      {
        "loincNumber": "2345-7",
        "commonName": "Glucose",
        "componentType": "CHEMISTRY"
      },
      {
        "loincNumber": "2951-2",
        "commonName": "Sodium",
        "componentType": "CHEMISTRY"
      }
    ],
    "total": 10
  }
}
```

---

### 8. Get Statistics

Get statistics about the LOINC database.

**Endpoint:** `GET /api/medical-standards/stats`

**Example Request:**
```bash
GET /api/medical-standards/stats
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalCodes": 54,
    "activeCodesByCategory": {
      "LABORATORY": 54,
      "CLINICAL": 0,
      "SURVEY": 0
    },
    "activeCodesByType": {
      "CHEMISTRY": 30,
      "HEMATOLOGY": 8,
      "MICROBIOLOGY": 0
    },
    "totalUnits": 108,
    "totalReferenceRanges": 72,
    "totalMappings": 0
  }
}
```

---

## Integration Examples

### Example 1: Standardize Lab Results from EHR

```typescript
// In EHR sync service
async function syncLabResults(ehrResults: any[]) {
  // Prepare batch request
  const results = ehrResults.map(result => ({
    loincNumber: mapEHRCodeToLOINC(result.code),
    value: result.value,
    unit: result.unit,
    patientAge: patient.age,
    patientGender: patient.gender,
  }));

  // Batch standardize
  const response = await fetch('/api/medical-standards/standardize/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ results }),
  });

  const { data } = await response.json();
  
  // Store standardized results
  for (const standardized of data.results) {
    await storeLabResult({
      originalValue: standardized.originalValue,
      standardizedValue: standardized.standardizedValue,
      unit: standardized.unit.unit,
      interpretation: standardized.interpretation,
      flags: standardized.flags,
      isAbnormal: !standardized.isWithinRange,
    });
  }
}
```

### Example 2: Display Lab Results with Interpretation

```typescript
// In UI component
async function displayLabResult(loincNumber: string, value: number, unit: string) {
  const response = await fetch('/api/medical-standards/standardize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      loincNumber,
      value,
      unit,
      patientAge: patient.age,
      patientGender: patient.gender,
    }),
  });

  const { data } = await response.json();

  return (
    <div className={data.isWithinRange ? 'text-green-600' : 'text-red-600'}>
      <h3>{data.loincCode.commonName}</h3>
      <p>Value: {data.standardizedValue} {data.unit.unit}</p>
      <p>Reference Range: {data.referenceRange.lowValue} - {data.referenceRange.highValue} {data.referenceRange.unit}</p>
      <p>Interpretation: {data.interpretation}</p>
      {data.flags.length > 0 && (
        <div className="flex gap-2">
          {data.flags.map(flag => (
            <span key={flag} className="badge badge-warning">{flag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 3: Search and Select LOINC Code

```typescript
// In test ordering UI
async function searchLOINCCodes(query: string) {
  const response = await fetch(
    `/api/medical-standards/loinc?query=${encodeURIComponent(query)}&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const { data } = await response.json();
  
  return data.codes.map(code => ({
    value: code.loincNumber,
    label: `${code.commonName} (${code.loincNumber})`,
    description: code.longName,
  }));
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing or invalid token)
- `404`: Not Found (LOINC code not found)
- `500`: Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to:
- 100 requests per minute for search endpoints
- 1000 requests per minute for standardization endpoints
- 10 requests per minute for statistics endpoints

---

## Best Practices

1. **Use Batch Endpoints**: When standardizing multiple results, use the batch endpoint for better performance.

2. **Cache LOINC Codes**: LOINC codes rarely change, so cache them in your application.

3. **Validate Before Standardizing**: Use the validate endpoint to check data quality before standardization.

4. **Include Demographics**: Always include patient age and gender for accurate reference ranges.

5. **Handle Errors Gracefully**: Some lab results may not have LOINC codes or reference ranges.

6. **Use Primary Units**: Store standardized values in primary units for consistency.

7. **Track Flags**: Monitor abnormal flags for clinical decision support.

---

## Support

For questions or issues with the Medical Standardization Repository API, contact:
- Email: support@holovitals.com
- Documentation: https://docs.holovitals.com/medical-standards