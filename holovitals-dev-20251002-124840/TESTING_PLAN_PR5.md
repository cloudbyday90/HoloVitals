# Testing Plan for PR #5: Clinical Data Viewer & Document Viewer

## 🎯 Overview

This testing plan covers all features implemented in PR #5, including:
- Clinical Data Viewer (Phase 1)
- Clinical Document Viewer

---

## 📋 Pre-Testing Setup

### 1. Environment Setup
```bash
# Checkout the feature branch
git checkout feature/clinical-document-viewer

# Install dependencies (if needed)
npm install

# Run database migrations
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### 2. Test Data Requirements
- Active EHR connection
- Synced patient data (labs, medications, allergies, conditions)
- Sample documents (PDFs, images)
- Test user account with authentication

---

## 🧪 Testing Checklist

### Phase 1: Clinical Dashboard (Main)

**URL:** `/clinical`

- [ ] **Page loads successfully**
- [ ] **Quick stats display correctly**
  - [ ] Total lab results count
  - [ ] Abnormal results count
  - [ ] Active medications count
  - [ ] Active conditions count
  - [ ] Allergies count
  - [ ] Recent documents count
- [ ] **Quick action buttons work**
  - [ ] "View Lab Results" navigates to `/clinical/labs`
  - [ ] "Manage Medications" navigates to `/clinical/medications`
  - [ ] "Health Timeline" navigates to `/clinical/timeline`
  - [ ] "View Documents" navigates to `/clinical/documents`
- [ ] **Recent activity feed displays**
- [ ] **Health summary card displays**
- [ ] **Responsive design works** (mobile, tablet, desktop)

---

### Phase 2: Lab Results Page

**URL:** `/clinical/labs`

#### Basic Functionality
- [ ] **Page loads successfully**
- [ ] **Lab results display in grid**
- [ ] **Lab result cards show:**
  - [ ] Test name
  - [ ] LOINC code
  - [ ] Value and unit
  - [ ] Reference range
  - [ ] Interpretation badge (Normal, High, Low, Critical)
  - [ ] Date and provider
  - [ ] Flags (if any)

#### Search & Filtering
- [ ] **Search functionality works**
  - [ ] Search by test name
  - [ ] Search by LOINC code
  - [ ] Results update in real-time
- [ ] **Interpretation filter works**
  - [ ] "All Results" shows all
  - [ ] "Normal" shows only normal results
  - [ ] "Abnormal" shows high/low results
  - [ ] "Critical" shows critical results
- [ ] **Date range filter works**
  - [ ] "All Time" shows all results
  - [ ] "Last 30 Days" filters correctly
  - [ ] "Last 90 Days" filters correctly
  - [ ] "Last Year" filters correctly

#### Interactions
- [ ] **Click on lab result card**
  - [ ] Opens detail view or modal (if implemented)
- [ ] **Export button** (placeholder)
- [ ] **Empty state displays** when no results
- [ ] **Loading state displays** while fetching

---

### Phase 3: Medications Page

**URL:** `/clinical/medications`

#### Basic Functionality
- [ ] **Page loads successfully**
- [ ] **Medications display in grid**
- [ ] **Medication cards show:**
  - [ ] Medication name
  - [ ] Dosage and frequency
  - [ ] Route
  - [ ] Purpose
  - [ ] Status badge
  - [ ] Prescriber
  - [ ] Date range
  - [ ] Drug interaction warnings (if any)

#### Tabs & Filtering
- [ ] **Active tab works**
  - [ ] Shows only active medications
  - [ ] Count is correct
- [ ] **Inactive tab works**
  - [ ] Shows only inactive medications
  - [ ] Count is correct
- [ ] **All tab works**
  - [ ] Shows all medications
  - [ ] Count is correct
- [ ] **Search functionality works**
  - [ ] Search by medication name
  - [ ] Search by generic name
  - [ ] Search by purpose
- [ ] **Status filter works**
  - [ ] Filters by active, completed, discontinued, on hold

#### Interactions
- [ ] **Click on medication card**
  - [ ] Opens detail view or modal (if implemented)
- [ ] **Add medication button** (placeholder)
- [ ] **Export button** (placeholder)
- [ ] **Empty states display** correctly
- [ ] **Loading states display** while fetching

---

### Phase 4: Health Timeline Page

**URL:** `/clinical/timeline`

#### Basic Functionality
- [ ] **Page loads successfully**
- [ ] **Timeline events display chronologically**
- [ ] **Timeline events show:**
  - [ ] Event type icon (color-coded)
  - [ ] Event title
  - [ ] Event description
  - [ ] Date and time
  - [ ] Provider (if available)
  - [ ] Location (if available)
  - [ ] Status
  - [ ] Category badge

#### Event Types
- [ ] **Medication events display** correctly
- [ ] **Diagnosis events display** correctly
- [ ] **Procedure events display** correctly
- [ ] **Immunization events display** correctly
- [ ] **Allergy events display** correctly

#### Search & Filtering
- [ ] **Search functionality works**
  - [ ] Search by event title
  - [ ] Search by description
  - [ ] Search by provider
- [ ] **Event type filter works**
  - [ ] Filter by encounters
  - [ ] Filter by lab results
  - [ ] Filter by medications
  - [ ] Filter by procedures
  - [ ] Filter by diagnoses
  - [ ] Filter by immunizations
  - [ ] Filter by allergies
- [ ] **Date range filter works**
  - [ ] "All Time" shows all events
  - [ ] "Last 30 Days" filters correctly
  - [ ] "Last 90 Days" filters correctly
  - [ ] "Last Year" filters correctly

#### Interactions
- [ ] **Click on timeline event**
  - [ ] Opens detail view or modal (if implemented)
- [ ] **Export button** (placeholder)
- [ ] **Empty state displays** when no events
- [ ] **Loading state displays** while fetching

---

### Phase 5: Allergies Page

**URL:** `/clinical/allergies`

#### Basic Functionality
- [ ] **Page loads successfully**
- [ ] **Allergies display in grid**
- [ ] **Allergy cards show:**
  - [ ] Allergen name
  - [ ] Allergy type
  - [ ] Reactions (badges)
  - [ ] Severity badge
  - [ ] Diagnosed date
  - [ ] Verification status
  - [ ] Warning icon for severe allergies

#### Critical Allergy Banner
- [ ] **Banner displays** when severe/life-threatening allergies exist
- [ ] **Banner shows warning message**
- [ ] **Banner is visually prominent** (red background)

#### Interactions
- [ ] **Click on allergy card**
  - [ ] Opens detail view or modal (if implemented)
- [ ] **Add allergy button** (placeholder)
- [ ] **Export button** (placeholder)
- [ ] **Empty state displays** when no allergies
- [ ] **Loading state displays** while fetching

---

### Phase 6: Conditions Page

**URL:** `/clinical/conditions`

#### Basic Functionality
- [ ] **Page loads successfully**
- [ ] **Conditions display in grid**
- [ ] **Condition cards show:**
  - [ ] Condition name
  - [ ] ICD-10 code
  - [ ] Clinical status badge
  - [ ] Severity (if available)
  - [ ] Category
  - [ ] Onset date
  - [ ] Resolved date (if applicable)
  - [ ] Diagnosed by
  - [ ] Verification status

#### Tabs & Filtering
- [ ] **Active tab works**
  - [ ] Shows only active conditions
  - [ ] Count is correct
- [ ] **Inactive tab works**
  - [ ] Shows only inactive conditions
  - [ ] Count is correct
- [ ] **All tab works**
  - [ ] Shows all conditions
  - [ ] Count is correct
- [ ] **Search functionality works**
  - [ ] Search by condition name
  - [ ] Search by ICD-10 code
  - [ ] Search by category
- [ ] **Status filter works**
  - [ ] Filters by active, inactive, resolved, remission

#### Interactions
- [ ] **Click on condition card**
  - [ ] Opens detail view or modal (if implemented)
- [ ] **Add condition button** (placeholder)
- [ ] **Export button** (placeholder)
- [ ] **Empty states display** correctly
- [ ] **Loading states display** while fetching

---

### Phase 7: Documents Library Page

**URL:** `/clinical/documents`

#### Basic Functionality
- [ ] **Page loads successfully**
- [ ] **Documents display in grid view**
- [ ] **Document cards show:**
  - [ ] Document type icon
  - [ ] Document title
  - [ ] Description
  - [ ] Type badge (color-coded)
  - [ ] Date
  - [ ] Provider
  - [ ] File size
  - [ ] Page count (if PDF)
  - [ ] Tags
  - [ ] Favorite star (if favorited)

#### View Modes
- [ ] **Grid view works**
  - [ ] Cards display in responsive grid
  - [ ] 3 columns on desktop
  - [ ] 2 columns on tablet
  - [ ] 1 column on mobile
- [ ] **List view works**
  - [ ] Documents display in compact list
  - [ ] All metadata visible

#### Search & Filtering
- [ ] **Search functionality works**
  - [ ] Search by title
  - [ ] Search by description
  - [ ] Search by provider
  - [ ] Search by category
- [ ] **Type filter works**
  - [ ] Filter by Lab Reports
  - [ ] Filter by Imaging
  - [ ] Filter by Clinical Notes
  - [ ] Filter by Discharge Summaries
  - [ ] Filter by Prescriptions
- [ ] **Date range filter works**
  - [ ] "All Time" shows all documents
  - [ ] "Last 30 Days" filters correctly
  - [ ] "Last 90 Days" filters correctly
  - [ ] "Last Year" filters correctly
- [ ] **Sort functionality works**
  - [ ] Sort by date (ascending/descending)
  - [ ] Sort by title (A-Z, Z-A)
  - [ ] Sort by type
  - [ ] Sort by size

#### Tabs
- [ ] **All Documents tab works**
  - [ ] Shows all documents
  - [ ] Count is correct
- [ ] **Recent tab works**
  - [ ] Shows documents from last 30 days
  - [ ] Count is correct
- [ ] **Favorites tab works**
  - [ ] Shows only favorited documents
  - [ ] Count is correct

#### Document Actions
- [ ] **View button works**
  - [ ] Opens PDF viewer for PDFs
  - [ ] Opens image viewer for images
  - [ ] Downloads other file types
- [ ] **Download button works**
  - [ ] Downloads file to device
  - [ ] Filename is correct
- [ ] **Share button** (placeholder)
- [ ] **Delete button** (placeholder)
- [ ] **Favorite button** (placeholder)
- [ ] **Dropdown menu works**
  - [ ] All actions accessible
  - [ ] Menu closes after selection

#### Empty & Loading States
- [ ] **Empty state displays** when no documents
- [ ] **Empty state message** is helpful
- [ ] **Loading state displays** while fetching
- [ ] **Skeleton loaders** show during loading

---

### Phase 8: PDF Viewer

**Trigger:** Click "View" on a PDF document

#### Basic Functionality
- [ ] **Viewer opens in fullscreen**
- [ ] **PDF renders correctly**
- [ ] **Document title displays** in header
- [ ] **Close button works**
  - [ ] Returns to documents library
  - [ ] Viewer closes completely

#### Zoom Controls
- [ ] **Zoom in button works**
  - [ ] PDF increases in size
  - [ ] Percentage updates
- [ ] **Zoom out button works**
  - [ ] PDF decreases in size
  - [ ] Percentage updates
- [ ] **Zoom percentage displays** correctly
- [ ] **Zoom limits work**
  - [ ] Cannot zoom below 50%
  - [ ] Cannot zoom above 200%

#### Actions
- [ ] **Print button works**
  - [ ] Opens print dialog
  - [ ] PDF prints correctly
- [ ] **Download button works**
  - [ ] Downloads PDF to device
- [ ] **Share button** (placeholder)
- [ ] **Fullscreen button works**
  - [ ] Enters fullscreen mode
  - [ ] Exits fullscreen mode

#### Responsive Design
- [ ] **Works on desktop**
- [ ] **Works on tablet**
- [ ] **Works on mobile**
- [ ] **Toolbar is accessible** on all devices

---

### Phase 9: Image Viewer

**Trigger:** Click "View" on an image document

#### Basic Functionality
- [ ] **Viewer opens in fullscreen**
- [ ] **Image renders correctly**
- [ ] **Document title displays** in header
- [ ] **Close button works**
  - [ ] Returns to documents library
  - [ ] Viewer closes completely

#### Zoom Controls
- [ ] **Zoom in button works**
  - [ ] Image increases in size
  - [ ] Percentage updates
  - [ ] Can zoom up to 400%
- [ ] **Zoom out button works**
  - [ ] Image decreases in size
  - [ ] Percentage updates
  - [ ] Can zoom down to 25%
- [ ] **Zoom percentage displays** correctly

#### Pan Functionality
- [ ] **Pan works when zoomed > 100%**
  - [ ] Cursor changes to grab/grabbing
  - [ ] Can drag image to move
  - [ ] Image stays within bounds
- [ ] **Pan disabled when zoom = 100%**

#### Rotation Controls
- [ ] **Rotate button works**
  - [ ] Rotates image 90° clockwise
  - [ ] Rotation value updates (0°, 90°, 180°, 270°)
  - [ ] Cycles back to 0° after 270°

#### Reset & Other Actions
- [ ] **Reset button works**
  - [ ] Resets zoom to 100%
  - [ ] Resets rotation to 0°
  - [ ] Resets position to center
- [ ] **Download button works**
  - [ ] Downloads image to device
- [ ] **Share button** (placeholder)
- [ ] **Fullscreen button works**
  - [ ] Enters fullscreen mode
  - [ ] Exits fullscreen mode

#### Info Bar
- [ ] **Info bar displays** at bottom
- [ ] **Shows current zoom percentage**
- [ ] **Shows current rotation**
- [ ] **Shows "Drag to pan" hint** when zoomed

#### Responsive Design
- [ ] **Works on desktop**
- [ ] **Works on tablet**
- [ ] **Works on mobile**
- [ ] **Touch gestures work** on mobile (if implemented)

---

### Phase 10: Document Upload

**Trigger:** Click "Upload Document" button

#### Modal Functionality
- [ ] **Modal opens**
- [ ] **Modal title displays** correctly
- [ ] **Modal description displays**
- [ ] **Close button works**
  - [ ] Modal closes
  - [ ] Form resets

#### File Selection
- [ ] **Drag-and-drop area displays**
- [ ] **Click to browse works**
  - [ ] File picker opens
  - [ ] Can select file
- [ ] **Drag-and-drop works**
  - [ ] Can drag file onto area
  - [ ] File is accepted
- [ ] **File validation works**
  - [ ] Accepts PDF files
  - [ ] Accepts image files (JPG, PNG)
  - [ ] Accepts DOC/DOCX files
  - [ ] Rejects files > 25MB
  - [ ] Shows error for invalid files

#### File Preview
- [ ] **File preview displays** after selection
- [ ] **Shows file name**
- [ ] **Shows file size**
- [ ] **Shows file icon**
- [ ] **Remove button works**
  - [ ] Removes file
  - [ ] Returns to upload area

#### Form Fields
- [ ] **Title field works**
  - [ ] Auto-fills from filename
  - [ ] Can be edited
  - [ ] Required validation works
- [ ] **Description field works**
  - [ ] Optional field
  - [ ] Multiline textarea
- [ ] **Type dropdown works**
  - [ ] Shows all 13 document types
  - [ ] Can select type
  - [ ] Default is "Other"
- [ ] **Date field works**
  - [ ] Defaults to today
  - [ ] Can select different date
  - [ ] Date picker works
- [ ] **Provider field works**
  - [ ] Optional field
  - [ ] Text input
- [ ] **Tags field works**
  - [ ] Optional field
  - [ ] Comma-separated input
  - [ ] Hint text displays

#### Upload Process
- [ ] **Upload button is disabled** when no file
- [ ] **Upload button is disabled** when no title
- [ ] **Upload button works** when valid
- [ ] **Progress bar displays** during upload
- [ ] **Progress percentage updates**
- [ ] **Upload completes successfully**
- [ ] **Success message displays** (if implemented)
- [ ] **Modal closes** after success
- [ ] **Documents list refreshes** with new document

#### Error Handling
- [ ] **Error displays** for file too large
- [ ] **Error displays** for invalid file type
- [ ] **Error displays** for upload failure
- [ ] **Error message is clear** and helpful
- [ ] **Can retry** after error

#### Loading States
- [ ] **Upload button shows loading** during upload
- [ ] **Form fields are disabled** during upload
- [ ] **Cannot close modal** during upload

---

## 🔍 API Testing

### Clinical Data APIs

#### Lab Results API
```bash
# Test GET /api/clinical/labs
curl http://localhost:3000/api/clinical/labs

# Test with filters
curl http://localhost:3000/api/clinical/labs?interpretations=HIGH,LOW&startDate=2025-01-01

# Test GET /api/clinical/labs/[testId]
curl http://localhost:3000/api/clinical/labs/[test-id]

# Test GET /api/clinical/labs/trends
curl http://localhost:3000/api/clinical/labs/trends?loincCode=2345-7
```

#### Medications API
```bash
# Test GET /api/clinical/medications
curl http://localhost:3000/api/clinical/medications

# Test with status filter
curl http://localhost:3000/api/clinical/medications?status=ACTIVE
```

#### Timeline API
```bash
# Test GET /api/clinical/timeline
curl http://localhost:3000/api/clinical/timeline

# Test with filters
curl http://localhost:3000/api/clinical/timeline?eventTypes=MEDICATION,DIAGNOSIS&startDate=2025-01-01
```

#### Allergies API
```bash
# Test GET /api/clinical/allergies
curl http://localhost:3000/api/clinical/allergies
```

#### Conditions API
```bash
# Test GET /api/clinical/conditions
curl http://localhost:3000/api/clinical/conditions

# Test with status filter
curl http://localhost:3000/api/clinical/conditions?status=ACTIVE
```

#### Documents API
```bash
# Test GET /api/clinical/documents
curl http://localhost:3000/api/clinical/documents

# Test with filters
curl http://localhost:3000/api/clinical/documents?type=LAB_REPORT&startDate=2025-01-01
```

#### Stats API
```bash
# Test GET /api/clinical/stats
curl http://localhost:3000/api/clinical/stats
```

### Document Management APIs

#### Upload API
```bash
# Test POST /api/documents/upload
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@test.pdf" \
  -F "title=Test Document" \
  -F "type=LAB_REPORT"
```

#### Document CRUD APIs
```bash
# Test GET /api/documents/[documentId]
curl http://localhost:3000/api/documents/[document-id]

# Test PATCH /api/documents/[documentId]
curl -X PATCH http://localhost:3000/api/documents/[document-id] \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'

# Test DELETE /api/documents/[documentId]
curl -X DELETE http://localhost:3000/api/documents/[document-id]
```

---

## 🐛 Bug Tracking

### Issues Found

| # | Component | Issue | Severity | Status |
|---|-----------|-------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## ✅ Sign-Off

### Testing Completed By
- **Name:** _______________
- **Date:** _______________
- **Environment:** _______________

### Test Results
- **Total Tests:** _______________
- **Passed:** _______________
- **Failed:** _______________
- **Blocked:** _______________

### Approval
- [ ] All critical features tested
- [ ] All bugs documented
- [ ] Ready for merge
- [ ] Ready for deployment

### Notes
_Add any additional notes or observations here_

---

## 📝 Next Steps

After testing is complete:

1. **Document all bugs** in GitHub issues
2. **Fix critical bugs** before merge
3. **Update PR** with test results
4. **Get approval** from reviewers
5. **Merge PR** to main branch
6. **Deploy to staging** for further testing
7. **Deploy to production** when ready

---

**Happy Testing! 🧪**