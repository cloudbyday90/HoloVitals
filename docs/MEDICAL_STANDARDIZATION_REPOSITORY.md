# Medical Standardization Repository

## Overview

The Medical Standardization Repository is a central reference system that standardizes medical data across the HoloVitals platform using industry-standard codes and terminologies, primarily LOINC (Logical Observation Identifiers Names and Codes) from Mayo Clinic.

## Purpose

### Problems Solved
1. **Inconsistent Lab Results**: Different EHR providers use different codes and units
2. **Data Integration**: Difficult to compare results from multiple sources
3. **Reference Ranges**: Varying reference ranges across providers
4. **Unit Conversions**: Different measurement units (mg/dL vs mmol/L)
5. **Result Interpretation**: Standardized interpretation of abnormal results

### Benefits
- **Unified Data Model**: Single source of truth for medical codes
- **Accurate Comparisons**: Compare results across providers and time
- **Clinical Decision Support**: Standardized data enables better AI analysis
- **Regulatory Compliance**: LOINC is required for many healthcare standards
- **Interoperability**: Industry-standard codes enable data exchange

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│         Medical Standardization Repository                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ LOINC Codes  │  │ Reference    │  │ Unit         │     │
│  │ Database     │  │ Ranges       │  │ Conversions  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Standardize  │  │ Interpret    │  │ Validate     │     │
│  │ Service      │  │ Service      │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ EHR Sync     │    │ FHIR         │    │ AI Analysis  │
│ Services     │    │ Processing   │    │ Services     │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Integration Flow

```
1. EHR Provider Data → Standardization Repository
   - Raw lab result with provider-specific code
   - Mapped to LOINC code
   - Units converted to standard
   - Reference range applied

2. Standardized Data → Storage
   - Stored with both original and standardized values
   - Maintains audit trail
   - Enables cross-provider comparison

3. Standardized Data → Analysis
   - AI services use standardized data
   - Consistent interpretation
   - Accurate trend analysis
```

## LOINC Code System

### What is LOINC?

LOINC (Logical Observation Identifiers Names and Codes) is a universal standard for identifying medical laboratory observations. Developed by the Regenstrief Institute and maintained by the LOINC Committee.

### LOINC Code Structure

```
LOINC Code: 2345-7
├── Component: Glucose
├── Property: Mass concentration (MCnc)
├── Timing: Point in time (Pt)
├── System: Serum/Plasma (Ser/Plas)
├── Scale: Quantitative (Qn)
└── Method: (optional)
```

### Common Lab Tests (Mayo Clinic LOINC Codes)

#### Chemistry Panel
- **2345-7**: Glucose, Serum/Plasma
- **2951-2**: Sodium, Serum/Plasma
- **2823-3**: Potassium, Serum/Plasma
- **2075-0**: Chloride, Serum/Plasma
- **2028-9**: Carbon Dioxide, Serum/Plasma
- **3094-0**: Blood Urea Nitrogen (BUN), Serum/Plasma
- **2160-0**: Creatinine, Serum/Plasma
- **1742-6**: Alanine Aminotransferase (ALT), Serum/Plasma
- **1920-8**: Aspartate Aminotransferase (AST), Serum/Plasma
- **1975-2**: Bilirubin, Total, Serum/Plasma

#### Lipid Panel
- **2093-3**: Cholesterol, Total, Serum/Plasma
- **2085-9**: HDL Cholesterol, Serum/Plasma
- **2089-1**: LDL Cholesterol, Serum/Plasma
- **2571-8**: Triglycerides, Serum/Plasma

#### Complete Blood Count (CBC)
- **6690-2**: White Blood Cell Count, Blood
- **789-8**: Red Blood Cell Count, Blood
- **718-7**: Hemoglobin, Blood
- **4544-3**: Hematocrit, Blood
- **777-3**: Platelet Count, Blood

#### Thyroid Panel
- **3016-3**: Thyroid Stimulating Hormone (TSH), Serum/Plasma
- **3051-0**: Thyroxine (T4), Free, Serum/Plasma
- **3053-6**: Triiodothyronine (T3), Free, Serum/Plasma

#### Hemoglobin A1c
- **4548-4**: Hemoglobin A1c, Blood

## Database Schema

### LOINCCode Table
```typescript
model LOINCCode {
  id                String   @id @default(cuid())
  loincNumber       String   @unique // e.g., "2345-7"
  component         String   // e.g., "Glucose"
  property          String   // e.g., "MCnc" (Mass concentration)
  timeAspect        String   // e.g., "Pt" (Point in time)
  system            String   // e.g., "Ser/Plas" (Serum/Plasma)
  scaleType         String   // e.g., "Qn" (Quantitative)
  methodType        String?  // Optional method
  
  // Display names
  longCommonName    String   // Full descriptive name
  shortName         String   // Abbreviated name
  displayName       String   // User-friendly name
  
  // Classification
  class             String   // e.g., "CHEM" (Chemistry)
  classType         Int      // Classification level
  
  // Units
  exampleUnits      String?  // Common units
  unitsRequired     Boolean  @default(false)
  
  // Status
  status            String   @default("ACTIVE") // ACTIVE, DEPRECATED, TRIAL
  versionFirstReleased String?
  versionLastChanged   String?
  
  // Relationships
  relatedNames      String[] // Alternative names
  synonyms          String[] // Synonyms
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  referenceRanges   ReferenceRange[]
  standardizations  LabResultStandardization[]
  
  @@index([loincNumber])
  @@index([component])
  @@index([class])
  @@index([status])
}
```

### ReferenceRange Table
```typescript
model ReferenceRange {
  id                String   @id @default(cuid())
  
  // LOINC Code
  loincCodeId       String
  loincCode         LOINCCode @relation(fields: [loincCodeId], references: [id], onDelete: Cascade)
  
  // Range values
  lowValue          Float?
  highValue         Float?
  unit              String
  
  // Interpretation
  interpretation    String   // NORMAL, LOW, HIGH, CRITICAL_LOW, CRITICAL_HIGH
  
  // Demographics
  ageMin            Int?     // Minimum age in years
  ageMax            Int?     // Maximum age in years
  gender            String?  // MALE, FEMALE, ALL
  
  // Conditions
  condition         String?  // e.g., "Pregnant", "Fasting"
  
  // Source
  source            String   @default("MAYO_CLINIC")
  sourceVersion     String?
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([loincCodeId])
  @@index([interpretation])
  @@index([gender])
}
```

### UnitConversion Table
```typescript
model UnitConversion {
  id                String   @id @default(cuid())
  
  // Source and target units
  fromUnit          String
  toUnit            String
  
  // Conversion formula
  conversionFactor  Float
  conversionOffset  Float    @default(0)
  // Formula: toValue = (fromValue * conversionFactor) + conversionOffset
  
  // Context
  loincCodeId       String?
  loincCode         LOINCCode? @relation(fields: [loincCodeId], references: [id])
  
  // Metadata
  description       String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([fromUnit, toUnit, loincCodeId])
  @@index([fromUnit])
  @@index([toUnit])
}
```

### LabResultStandardization Table
```typescript
model LabResultStandardization {
  id                String   @id @default(cuid())
  
  // Original data
  originalCode      String   // Provider-specific code
  originalCodeSystem String  // e.g., "EPIC", "CERNER"
  originalName      String
  originalValue     Float
  originalUnit      String
  
  // Standardized data
  loincCodeId       String
  loincCode         LOINCCode @relation(fields: [loincCodeId], references: [id])
  standardizedValue Float
  standardizedUnit  String
  
  // Interpretation
  interpretation    String   // NORMAL, LOW, HIGH, CRITICAL_LOW, CRITICAL_HIGH
  referenceRangeId  String?
  referenceRange    ReferenceRange? @relation(fields: [referenceRangeId], references: [id])
  
  // Context
  patientId         String
  patient           User     @relation(fields: [patientId], references: [id])
  fhirResourceId    String?
  fhirResource      FHIRResource? @relation(fields: [fhirResourceId], references: [id])
  
  // Audit
  standardizedAt    DateTime @default(now())
  standardizedBy    String   @default("SYSTEM")
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([originalCode, originalCodeSystem])
  @@index([loincCodeId])
  @@index([patientId])
  @@index([interpretation])
}
```

## Service Implementation

### MedicalStandardizationService

```typescript
class MedicalStandardizationService {
  // LOINC Code Management
  async getLOINCCode(loincNumber: string): Promise<LOINCCode>
  async searchLOINCCodes(query: string): Promise<LOINCCode[]>
  async getLOINCCodesByClass(classType: string): Promise<LOINCCode[]>
  
  // Standardization
  async standardizeLabResult(result: RawLabResult): Promise<StandardizedLabResult>
  async batchStandardize(results: RawLabResult[]): Promise<StandardizedLabResult[]>
  
  // Unit Conversion
  async convertUnit(value: number, fromUnit: string, toUnit: string, loincCode?: string): Promise<number>
  async getAvailableUnits(loincCode: string): Promise<string[]>
  
  // Reference Ranges
  async getReferenceRange(loincCode: string, demographics: Demographics): Promise<ReferenceRange>
  async interpretResult(value: number, loincCode: string, demographics: Demographics): Promise<Interpretation>
  
  // Mapping
  async mapProviderCodeToLOINC(providerCode: string, providerSystem: string): Promise<LOINCCode>
  async createMapping(providerCode: string, providerSystem: string, loincCode: string): Promise<void>
}
```

### Example Usage

```typescript
// 1. Standardize a lab result from Epic
const epicResult = {
  code: "EPIC_GLU",
  name: "Glucose",
  value: 100,
  unit: "mg/dL",
  providerSystem: "EPIC"
};

const standardized = await medicalStandardizationService.standardizeLabResult(epicResult);
// Result:
// {
//   loincCode: "2345-7",
//   loincName: "Glucose, Serum/Plasma",
//   value: 100,
//   unit: "mg/dL",
//   standardizedValue: 5.55,
//   standardizedUnit: "mmol/L",
//   interpretation: "NORMAL",
//   referenceRange: { low: 70, high: 100, unit: "mg/dL" }
// }

// 2. Convert units
const mgdl = 100; // mg/dL
const mmol = await medicalStandardizationService.convertUnit(
  mgdl, 
  "mg/dL", 
  "mmol/L", 
  "2345-7"
);
// Result: 5.55 mmol/L

// 3. Interpret result
const interpretation = await medicalStandardizationService.interpretResult(
  150, // value
  "2345-7", // glucose LOINC code
  { age: 45, gender: "MALE" }
);
// Result:
// {
//   interpretation: "HIGH",
//   referenceRange: { low: 70, high: 100, unit: "mg/dL" },
//   message: "Glucose level is above normal range. Consider fasting glucose test."
// }
```

## Integration with EHR Services

### Epic Integration

```typescript
// In EpicEnhancedService
async syncDiagnosticReports(connectionId: string): Promise<void> {
  const reports = await this.fetchDiagnosticReports(connectionId);
  
  for (const report of reports) {
    // Extract lab results
    const results = this.extractLabResults(report);
    
    // Standardize each result
    for (const result of results) {
      const standardized = await medicalStandardizationService.standardizeLabResult({
        code: result.code,
        name: result.name,
        value: result.value,
        unit: result.unit,
        providerSystem: "EPIC"
      });
      
      // Store standardized result
      await prisma.labResultStandardization.create({
        data: {
          originalCode: result.code,
          originalCodeSystem: "EPIC",
          originalName: result.name,
          originalValue: result.value,
          originalUnit: result.unit,
          loincCodeId: standardized.loincCodeId,
          standardizedValue: standardized.standardizedValue,
          standardizedUnit: standardized.standardizedUnit,
          interpretation: standardized.interpretation,
          patientId: connection.userId,
          fhirResourceId: report.id
        }
      });
    }
  }
}
```

### Cerner Integration

```typescript
// In CernerEnhancedService
async syncObservations(connectionId: string): Promise<void> {
  const observations = await this.fetchObservations(connectionId);
  
  // Batch standardization for better performance
  const rawResults = observations.map(obs => ({
    code: obs.code.coding[0].code,
    name: obs.code.text,
    value: obs.valueQuantity.value,
    unit: obs.valueQuantity.unit,
    providerSystem: "CERNER"
  }));
  
  const standardized = await medicalStandardizationService.batchStandardize(rawResults);
  
  // Store all standardized results
  await prisma.labResultStandardization.createMany({
    data: standardized.map((result, index) => ({
      originalCode: rawResults[index].code,
      originalCodeSystem: "CERNER",
      originalName: rawResults[index].name,
      originalValue: rawResults[index].value,
      originalUnit: rawResults[index].unit,
      loincCodeId: result.loincCodeId,
      standardizedValue: result.standardizedValue,
      standardizedUnit: result.standardizedUnit,
      interpretation: result.interpretation,
      patientId: connection.userId,
      fhirResourceId: observations[index].id
    }))
  });
}
```

## API Endpoints

### LOINC Code Endpoints

```typescript
// GET /api/medical-standards/loinc/:loincNumber
// Get LOINC code details
{
  "loincNumber": "2345-7",
  "component": "Glucose",
  "longCommonName": "Glucose [Mass/volume] in Serum or Plasma",
  "shortName": "Glucose SerPl-mCnc",
  "displayName": "Glucose, Serum/Plasma",
  "class": "CHEM",
  "exampleUnits": "mg/dL",
  "status": "ACTIVE"
}

// GET /api/medical-standards/loinc/search?q=glucose
// Search LOINC codes
{
  "results": [
    {
      "loincNumber": "2345-7",
      "displayName": "Glucose, Serum/Plasma",
      "class": "CHEM"
    },
    {
      "loincNumber": "2339-0",
      "displayName": "Glucose, Blood",
      "class": "CHEM"
    }
  ],
  "total": 2
}

// GET /api/medical-standards/loinc/class/CHEM
// Get LOINC codes by class
{
  "class": "CHEM",
  "codes": [...],
  "total": 150
}
```

### Standardization Endpoints

```typescript
// POST /api/medical-standards/standardize
// Standardize a lab result
{
  "code": "EPIC_GLU",
  "name": "Glucose",
  "value": 100,
  "unit": "mg/dL",
  "providerSystem": "EPIC"
}
// Response:
{
  "loincCode": "2345-7",
  "loincName": "Glucose, Serum/Plasma",
  "originalValue": 100,
  "originalUnit": "mg/dL",
  "standardizedValue": 5.55,
  "standardizedUnit": "mmol/L",
  "interpretation": "NORMAL",
  "referenceRange": {
    "low": 70,
    "high": 100,
    "unit": "mg/dL"
  }
}

// POST /api/medical-standards/standardize/batch
// Batch standardize multiple results
{
  "results": [
    { "code": "EPIC_GLU", "value": 100, "unit": "mg/dL", "providerSystem": "EPIC" },
    { "code": "CERNER_NA", "value": 140, "unit": "mEq/L", "providerSystem": "CERNER" }
  ]
}
// Response:
{
  "standardized": [...],
  "total": 2,
  "successful": 2,
  "failed": 0
}
```

### Unit Conversion Endpoints

```typescript
// POST /api/medical-standards/convert
// Convert units
{
  "value": 100,
  "fromUnit": "mg/dL",
  "toUnit": "mmol/L",
  "loincCode": "2345-7"
}
// Response:
{
  "originalValue": 100,
  "originalUnit": "mg/dL",
  "convertedValue": 5.55,
  "convertedUnit": "mmol/L",
  "conversionFactor": 0.0555
}

// GET /api/medical-standards/units/:loincCode
// Get available units for a LOINC code
{
  "loincCode": "2345-7",
  "units": ["mg/dL", "mmol/L", "g/L"],
  "preferredUnit": "mg/dL"
}
```

### Reference Range Endpoints

```typescript
// GET /api/medical-standards/reference-range/:loincCode
// Get reference range
{
  "loincCode": "2345-7",
  "age": 45,
  "gender": "MALE"
}
// Response:
{
  "loincCode": "2345-7",
  "displayName": "Glucose, Serum/Plasma",
  "referenceRange": {
    "low": 70,
    "high": 100,
    "unit": "mg/dL"
  },
  "interpretation": {
    "normal": "70-100 mg/dL",
    "low": "< 70 mg/dL (Hypoglycemia)",
    "high": "> 100 mg/dL (Hyperglycemia)",
    "criticalLow": "< 50 mg/dL (Severe Hypoglycemia)",
    "criticalHigh": "> 200 mg/dL (Severe Hyperglycemia)"
  }
}

// POST /api/medical-standards/interpret
// Interpret a result
{
  "value": 150,
  "loincCode": "2345-7",
  "unit": "mg/dL",
  "demographics": {
    "age": 45,
    "gender": "MALE"
  }
}
// Response:
{
  "interpretation": "HIGH",
  "severity": "MODERATE",
  "referenceRange": { "low": 70, "high": 100, "unit": "mg/dL" },
  "message": "Glucose level is above normal range. Consider fasting glucose test or HbA1c.",
  "recommendations": [
    "Consult with healthcare provider",
    "Monitor blood glucose regularly",
    "Consider dietary modifications"
  ]
}
```

## Data Seeding

### Mayo Clinic LOINC Codes

The repository will be pre-seeded with the most common lab tests from Mayo Clinic:

1. **Chemistry Panel** (15 tests)
2. **Lipid Panel** (4 tests)
3. **Complete Blood Count** (10 tests)
4. **Thyroid Panel** (3 tests)
5. **Liver Function** (8 tests)
6. **Kidney Function** (5 tests)
7. **Hemoglobin A1c** (1 test)
8. **Vitamin D** (1 test)
9. **Iron Studies** (4 tests)
10. **Coagulation** (3 tests)

**Total: 54 most common lab tests**

### Reference Ranges

Reference ranges will be seeded from Mayo Clinic guidelines:
- Age-specific ranges (pediatric, adult, geriatric)
- Gender-specific ranges
- Condition-specific ranges (pregnant, fasting, etc.)

### Unit Conversions

Common unit conversions will be pre-configured:
- mg/dL ↔ mmol/L (glucose, cholesterol)
- g/dL ↔ g/L (hemoglobin)
- mEq/L ↔ mmol/L (electrolytes)
- ng/mL ↔ nmol/L (hormones)
- IU/L ↔ U/L (enzymes)

## Benefits Summary

### For Patients
- **Consistent Results**: Compare lab results from different providers
- **Clear Interpretation**: Understand what results mean
- **Trend Analysis**: Track changes over time accurately
- **Better Insights**: AI can provide more accurate analysis

### For Healthcare Providers
- **Interoperability**: Exchange data with other systems
- **Clinical Decision Support**: Standardized data enables better tools
- **Regulatory Compliance**: Meet LOINC requirements
- **Quality Improvement**: Consistent data for analytics

### For Platform
- **Data Quality**: High-quality, standardized data
- **AI Performance**: Better training data for AI models
- **Scalability**: Easy to add new providers
- **Maintenance**: Centralized code management

## Performance Considerations

### Caching Strategy
- LOINC codes cached in memory (rarely change)
- Reference ranges cached per demographic group
- Unit conversions cached (static data)

### Batch Processing
- Batch standardization for bulk imports
- Async processing for large datasets
- Queue-based processing for EHR syncs

### Database Optimization
- Indexes on frequently queried fields
- Materialized views for common queries
- Partitioning for large tables

## Future Enhancements

### Phase 1 (Current)
- ✅ LOINC code database
- ✅ Reference ranges
- ✅ Unit conversions
- ✅ Basic standardization

### Phase 2 (Next)
- SNOMED CT integration (diagnoses, procedures)
- RxNorm integration (medications)
- ICD-10 mapping
- CPT code support

### Phase 3 (Future)
- Machine learning for code mapping
- Natural language processing for unstructured results
- Predictive analytics
- Clinical decision support rules

## Compliance & Standards

### Standards Supported
- **LOINC**: Lab observations
- **UCUM**: Units of measure
- **HL7 FHIR**: Data exchange
- **HIPAA**: Privacy and security

### Regulatory Requirements
- FDA 21 CFR Part 11 (Electronic Records)
- CLIA (Clinical Laboratory Improvement Amendments)
- CAP (College of American Pathologists)

## Conclusion

The Medical Standardization Repository provides a robust foundation for standardizing medical data across the HoloVitals platform. By using Mayo Clinic LOINC codes and industry-standard terminologies, we ensure data quality, interoperability, and compliance while enabling advanced AI analysis and clinical decision support.