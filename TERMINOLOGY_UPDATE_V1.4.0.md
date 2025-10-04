# Terminology Update: Customer vs Patient

## Important Clarification

HoloVitals is a **Medical AI Assistant Platform**, not a healthcare provider. We do not provide direct medical care, diagnosis, or treatment. Therefore, our users should be referred to as **customers**, not patients.

## Business Model
- **What We Are**: Medical AI Assistant platform providing personalized health tracking, reminders, and care coordination
- **What We're Not**: Healthcare provider with doctor-patient relationships
- **Medical Staff**: May have doctors/nurses on staff to ensure accuracy, but no direct patient care
- **User Relationship**: Customer relationship, not patient relationship

## Required Changes for v1.4.1

### 1. View Switching Terminology
**Current**: "Patient View" / "Staff View"  
**Should Be**: "Customer View" / "Staff View"

**Files to Update**:
- `components/staff/StaffHeader.tsx` - Rocket button labels
- `lib/utils/viewMode.ts` - View mode constants
- `app/api/view-mode/route.ts` - API endpoint
- All documentation referring to "patient view"

### 2. Navigation & UI Labels
**Current**: References to "patients"  
**Should Be**: References to "customers"

**Files to Update**:
- Staff sidebar navigation
- Dashboard labels
- Analytics terminology
- Search functionality labels

### 3. Database & Code
**Current**: May have "patient" in variable names, comments  
**Should Be**: "customer" or "user" terminology

**Areas to Review**:
- Variable names
- Function names
- Comments
- API endpoint paths (consider for v2.0 to avoid breaking changes)

### 4. Documentation
**Current**: "Patient portal", "patient accounts"  
**Should Be**: "Customer portal", "customer accounts"

**Files to Update**:
- API_DOCUMENTATION_V1.4.0.md
- STAFF_PORTAL_USER_GUIDE.md
- CHANGELOG_V1.4.0.md
- All architecture documents

## Implementation Plan

### Option A: Quick Fix for v1.4.1 (Recommended)
- Update UI labels and user-facing text only
- Keep internal code/database terminology for now
- Update all documentation
- **Timeline**: Can be done immediately

### Option B: Comprehensive Update for v2.0
- Refactor all code to use "customer" terminology
- Update database schema and migrations
- Update API endpoints (breaking change)
- Complete terminology overhaul
- **Timeline**: Major version update

## Recommendation

Proceed with **Option A** for v1.4.1:
1. Update all user-facing labels from "Patient View" to "Customer View"
2. Update documentation to reflect customer relationship
3. Add comments in code noting the terminology distinction
4. Plan comprehensive refactor for v2.0

This maintains backward compatibility while correcting the user-facing terminology immediately.

---

**Created**: January 4, 2025  
**Priority**: High  
**Target Version**: v1.4.1