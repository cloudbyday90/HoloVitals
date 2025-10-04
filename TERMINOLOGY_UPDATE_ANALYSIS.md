# HoloVitals v1.4.1 - Terminology Update Analysis

## Overview
This document analyzes the scope and impact of updating terminology from "patient" to "customer" throughout the HoloVitals codebase.

## Scope of Changes

### 1. Database Schema (Prisma)
**Impact: HIGH - Requires database migration**

The Prisma schema contains numerous model names with "Patient" prefix:
- `PatientAccessRequest`
- `PatientAllergy`
- `PatientAmendmentRequest`
- `PatientCommunicationRequest`
- `PatientConsent`
- `PatientDiagnosis`
- `PatientFamilyHistory`
- `PatientImmunization`
- `PatientMedication`
- `PatientProcedure`
- `PatientRepository`
- And many more...

**Considerations:**
- Changing model names requires a database migration
- Existing data must be preserved
- Table names are mapped with `@@map()` directives
- Foreign key relationships must be maintained
- This could break existing deployments if not handled carefully

### 2. API Endpoints
**Impact: MEDIUM - Breaking change for API consumers**

Many API routes contain "patient" in their paths:
- `/api/patients/*`
- `/api/audit-logs/patient/[patientId]/*`
- `/api/ehr/patients/*`
- `/api/patient-rights/*`

**Considerations:**
- Changing URLs breaks existing API consumers
- May need to maintain backward compatibility
- Documentation must be updated

### 3. Frontend Components
**Impact: MEDIUM - UI text and component names**

Components with "Patient" in their names:
- `PatientCard`
- `PatientDetailView`
- `PatientList`
- `PatientSearch`
- `PatientSearchBar`

**Considerations:**
- Component names can be changed without breaking functionality
- UI text changes are straightforward
- Props and interfaces need updating

### 4. Services and Business Logic
**Impact: MEDIUM - Internal code changes**

Services with "Patient" references:
- `PatientRightsService`
- `PatientSearchService`
- Various EHR services with patient-related methods

**Considerations:**
- Internal changes don't affect external APIs
- Type definitions need updating
- Method names and parameters need updating

## Recommended Approach

### Option 1: Comprehensive Update (Breaking Change)
**Pros:**
- Complete terminology alignment
- Clean codebase
- No legacy terminology

**Cons:**
- Requires database migration
- Breaking change for API consumers
- Requires careful coordination
- Higher risk

### Option 2: Gradual Migration (Backward Compatible)
**Pros:**
- Lower risk
- Maintains backward compatibility
- Can be done incrementally

**Cons:**
- Mixed terminology during transition
- More complex codebase
- Requires maintaining both old and new APIs

### Option 3: UI-Only Update (Minimal Risk)
**Pros:**
- No breaking changes
- Quick to implement
- Low risk

**Cons:**
- Inconsistent terminology (UI vs backend)
- Doesn't fully address the requirement
- Technical debt

## Recommendation

Given that this is a **minor version update (v1.4.1)**, I recommend **Option 3: UI-Only Update** for now, with a plan for **Option 1: Comprehensive Update** in a future **major version (v2.0.0)**.

### Phase 1 (v1.4.1) - UI and Documentation Only
1. Update all UI text and labels
2. Update component display names
3. Update documentation
4. Keep database schema and API endpoints unchanged
5. Add deprecation notices for future changes

### Phase 2 (v2.0.0) - Complete Migration
1. Create database migration scripts
2. Update Prisma schema
3. Update API endpoints with versioning
4. Provide migration guide for API consumers
5. Maintain backward compatibility layer

## Impact Assessment

### Current Session Scope
Based on the initial script run, we've identified:
- **189 files scanned**
- **Potential updates in multiple areas**

### Risk Level by Area
- **Database Schema**: 🔴 HIGH RISK (requires migration)
- **API Endpoints**: 🟡 MEDIUM RISK (breaking change)
- **Frontend Components**: 🟢 LOW RISK (safe to change)
- **Internal Services**: 🟢 LOW RISK (internal only)
- **Documentation**: 🟢 LOW RISK (safe to change)

## Next Steps

1. **Confirm approach with user** - Which option to pursue?
2. **Create detailed implementation plan** based on chosen option
3. **Execute changes** systematically
4. **Test thoroughly** to ensure no regressions
5. **Document changes** in changelog and migration guide

## Questions for User

1. Is this a breaking change acceptable for v1.4.1?
2. Should we maintain backward compatibility?
3. Are there existing API consumers that would be affected?
4. What is the timeline for this update?
5. Should we plan for a v2.0.0 with complete migration?