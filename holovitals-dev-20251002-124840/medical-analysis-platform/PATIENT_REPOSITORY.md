# HoloVitals Patient Repository System

## Overview

The Patient Repository system provides **sandboxed, isolated data storage** for each patient in HoloVitals. Unlike traditional centralized databases, each patient has their own complete repository that is:

- **Isolated:** Completely separate from other patients
- **Comprehensive:** Contains all patient data in one place
- **Encrypted:** Personal information is encrypted at rest
- **Identity-Verified:** Tied to patient identity, not just email
- **One-Per-Patient:** Enforced through multi-factor identity verification

## Core Concept: One Repository Per Patient

### Why This Matters

Traditional systems store all patients in a central database, which creates:
- ❌ Single point of failure
- ❌ Difficult data isolation
- ❌ Complex access control
- ❌ Privacy concerns
- ❌ Compliance challenges

HoloVitals uses **sandboxed repositories** where:
- ✅ Each patient has their own isolated data store
- ✅ Data breaches affect only one patient
- ✅ Complete data portability
- ✅ Simplified privacy compliance
- ✅ True data ownership

## Identity Verification System

### Three Primary Identity Factors (Required)

1. **Date of Birth**
   - Full date (MM/DD/YYYY)
   - Used for primary identity hash
   - Cannot be changed after creation

2. **Full Name**
   - First name, middle name (optional), last name
   - Normalized for consistent matching
   - Used for primary identity hash

3. **Place of Birth**
   - City, State, Country
   - Permanent identifier
   - Used for primary identity hash

### Secondary Identity Factors (Recommended - At Least 2)

4. **Social Security Number (Last 4 Digits)**
   - Only last 4 digits stored (hashed)
   - Used for secondary verification
   - Optional but recommended

5. **Mother's Maiden Name**
   - Stored as hash only
   - Used for identity challenges
   - Cannot be retrieved, only verified

6. **Medical Record Number**
   - From previous healthcare provider
   - Helps prevent duplicates
   - Optional

7. **Previous Address**
   - Last known address
   - Stored as hash
   - Used for verification challenges

8. **Phone Number**
   - For verification purposes
   - Can be used for MFA
   - Optional

### Additional Recommendations

Based on your requirements, here are additional identity verification methods:

9. **Government ID Verification**
   - Driver's license number (hashed)
   - Passport number (hashed)
   - State ID number (hashed)
   - Verification through ID.me or similar service

10. **Biometric Verification (Future)**
    - Fingerprint hash
    - Facial recognition hash
    - Voice print hash
    - Stored as irreversible hashes only

11. **Healthcare Provider Verification**
    - Previous doctor's name and practice
    - Hospital where born
    - Recent procedure or visit details
    - Prescription verification

12. **Financial Verification**
    - Last 4 digits of credit card used for healthcare
    - Insurance policy number (last 4 digits)
    - Bank account verification (micro-deposits)

13. **Knowledge-Based Authentication (KBA)**
    - Security questions with personal answers
    - Historical address verification
    - Previous employer information
    - Educational institution details

14. **Multi-Device Verification**
    - Device fingerprinting
    - Trusted device registration
    - Location-based verification
    - Behavioral biometrics

## Identity Hash System

### How It Works

```typescript
// Primary Hash (Required Factors)
const primaryData = [
  dateOfBirth,
  firstName,
  middleName,
  lastName,
  cityOfBirth,
  stateOfBirth,
  countryOfBirth
].join('|');

const primaryHash = pbkdf2(primaryData, salt, 10000 iterations);

// Secondary Hash (Additional Factors)
const secondaryData = [
  ssnLast4,
  mothersMaidenName,
  medicalRecordNumber,
  phoneNumber
].join('|');

const secondaryHash = pbkdf2(secondaryData, salt, 10000 iterations);

// Composite Hash (Unique Identifier)
const compositeHash = pbkdf2(primaryHash + secondaryHash, salt, 10000 iterations);
```

### Why Hashing?

- **Privacy:** Original data not stored in plain text
- **Security:** Cannot reverse-engineer identity from hash
- **Uniqueness:** Composite hash ensures one repository per person
- **Verification:** Can verify identity without storing PII

## Repository Creation Flow

```
1. User Registers
   ↓
2. Provide Identity Factors
   ↓
3. Generate Identity Hashes
   ↓
4. Check for Existing Repository
   ↓
5. If Exists → Prevent Creation (Suggest Migration)
   ↓
6. If New → Verify Identity Confidence
   ↓
7. If Confidence < 85% → Request Additional Factors
   ↓
8. If Confidence ≥ 85% → Create Repository
   ↓
9. Encrypt Personal Information
   ↓
10. Initialize Medical Data Structure
    ↓
11. Link to User Account
    ↓
12. Repository Ready
```

## Repository Data Structure

### Personal Information (Encrypted)

```typescript
{
  firstName: "John",
  middleName: "Michael",
  lastName: "Doe",
  dateOfBirth: "1980-01-15",
  gender: "male",
  placeOfBirth: {
    city: "Boston",
    state: "Massachusetts",
    country: "USA"
  },
  email: "john.doe@example.com",
  phone: "+1-555-0123",
  address: {
    street: "123 Main St",
    city: "Boston",
    state: "MA",
    zipCode: "02101",
    country: "USA"
  },
  emergencyContact: {
    name: "Jane Doe",
    relationship: "Spouse",
    phone: "+1-555-0124"
  }
}
```

### Medical Information

```typescript
{
  diagnoses: [
    {
      id: "diag_123",
      condition: "Type 2 Diabetes",
      icd10Code: "E11.9",
      diagnosedDate: "2020-03-15",
      status: "active",
      severity: "moderate",
      notes: "Well controlled with medication"
    }
  ],
  medications: [
    {
      id: "med_456",
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      startDate: "2020-03-15",
      status: "active",
      prescribedBy: "Dr. Smith"
    }
  ],
  allergies: [
    {
      id: "allergy_789",
      allergen: "Penicillin",
      type: "drug",
      reaction: "Hives and difficulty breathing",
      severity: "severe"
    }
  ],
  vitalSigns: [
    {
      id: "vital_101",
      date: "2024-01-15",
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: 72,
      weight: 180,
      height: 70,
      bmi: 25.8
    }
  ],
  testResults: [...],
  procedures: [...],
  immunizations: [...],
  familyHistory: [...],
  socialHistory: {...}
}
```

### Stored Context (For AI)

```typescript
{
  recentAnalyses: [
    "analysis_id_1",
    "analysis_id_2"
  ],
  importantFindings: [
    "Elevated glucose levels trending upward",
    "Blood pressure well controlled"
  ],
  trends: {
    glucose: "increasing",
    bloodPressure: "stable",
    weight: "decreasing"
  },
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

## One Repository Per Patient Enforcement

### Prevention Mechanisms

1. **Identity Hash Uniqueness**
   ```sql
   CREATE UNIQUE INDEX ON patient_repositories(composite_identity_hash);
   ```

2. **User ID Uniqueness**
   ```sql
   CREATE UNIQUE INDEX ON patient_repositories(user_id);
   ```

3. **Application-Level Checks**
   ```typescript
   const existing = await identityVerificationService.hasExistingRepository(identityFactors);
   if (existing) {
     throw new Error('Repository already exists for this identity');
   }
   ```

### What Happens If User Tries to Create Second Account?

```
Scenario: User tries to register with different email but same identity

1. User enters identity factors (DOB, name, place of birth)
   ↓
2. System generates identity hash
   ↓
3. System finds existing repository with same hash
   ↓
4. System prevents creation
   ↓
5. System offers two options:
   a) Migrate existing account to new email
   b) Recover existing account
```

## Account Migration

### When to Use Migration

- Changing email address
- Changing username
- Consolidating accounts
- Recovering lost access

### Migration Process

```
1. User Requests Migration
   ↓
2. Verify Current Account Ownership
   - Current email verification
   - MFA token
   - Identity factors
   ↓
3. Verify Identity (High Confidence Required ≥ 90%)
   - All primary factors
   - At least 2 secondary factors
   - Additional verification challenges
   ↓
4. Generate Migration Token
   ↓
5. Send Confirmation to Both Emails
   ↓
6. User Confirms Migration
   ↓
7. Update Repository User ID
   ↓
8. Invalidate Old Sessions
   ↓
9. Log Migration (Audit Trail)
   ↓
10. Migration Complete
```

### Migration Security

```typescript
const verification = await identityVerificationService.verifyForMigration(
  repositoryId,
  identityFactors,
  {
    currentEmail: 'old@example.com',
    mfaToken: '123456',
    securityQuestionAnswers: {
      'mothers_maiden_name': 'Smith',
      'place_of_birth': 'Boston'
    }
  }
);

// Requires 90% confidence for migration
if (verification.confidence < 0.9) {
  throw new Error('Insufficient verification for migration');
}
```

## Repository Deletion & Purging

### Complete Data Removal

When a user deletes their account:

1. **Confirmation Required**
   - Email confirmation token
   - MFA verification
   - Identity verification
   - Explicit consent checkbox

2. **Data Purging Process**
   ```
   1. Verify User Ownership
      ↓
   2. Verify Deletion Token
      ↓
   3. Log Deletion (Audit Trail)
      ↓
   4. Delete All Medical Data
      - Diagnoses
      - Medications
      - Allergies
      - Vital signs
      - Test results
      - Procedures
      - Immunizations
      - Family history
      ↓
   5. Delete All Documents
      ↓
   6. Delete All Context Data
      ↓
   7. Delete Repository
      ↓
   8. Purge Complete
   ```

3. **What Gets Deleted**
   - ✅ All personal information
   - ✅ All medical records
   - ✅ All documents
   - ✅ All test results
   - ✅ All stored context
   - ✅ All preferences
   - ✅ Repository metadata

4. **What Gets Retained (Audit Only)**
   - ✅ Audit logs (for compliance)
   - ✅ Deletion timestamp
   - ✅ Deletion reason
   - ⚠️ No PII/PHI in retained logs

### Deletion is Irreversible

```
⚠️ WARNING: IRREVERSIBLE ACTION

Deleting your repository will permanently remove:
- All your medical records
- All uploaded documents
- All test results
- All stored analyses
- All personal information

This action CANNOT be undone.

To proceed, you must:
1. Enter your password
2. Enter your MFA code
3. Verify your identity
4. Type "DELETE MY DATA" to confirm

Are you absolutely sure? [Yes] [No]
```

## Data Isolation & Sandboxing

### How Repositories Are Isolated

1. **Database Level**
   - Each repository has unique ID
   - All data linked to repository ID
   - Foreign key constraints enforce isolation
   - Cascade deletes ensure complete removal

2. **Application Level**
   - Repository ID required for all queries
   - User can only access their own repository
   - Middleware enforces repository ownership
   - No cross-repository queries allowed

3. **Encryption Level**
   - Each repository's personal info encrypted separately
   - Unique encryption keys per repository
   - No shared encryption across repositories

### Access Control

```typescript
// Middleware ensures user can only access their repository
async function requireRepositoryOwnership(req, res, next) {
  const userId = req.user.id;
  const repositoryId = req.params.repositoryId;
  
  const repository = await patientRepository.getRepository(repositoryId);
  
  if (repository.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  next();
}
```

## Usage Examples

### Creating a Repository

```typescript
const repository = await patientRepository.createRepository(
  userId,
  {
    // Primary factors (required)
    dateOfBirth: new Date('1980-01-15'),
    fullName: {
      firstName: 'John',
      middleName: 'Michael',
      lastName: 'Doe'
    },
    placeOfBirth: {
      city: 'Boston',
      state: 'Massachusetts',
      country: 'USA'
    },
    
    // Secondary factors (recommended)
    socialSecurityNumber: '6789', // Last 4 digits
    mothersMaidenName: 'Smith',
    phoneNumber: '+15550123'
  },
  {
    // Personal information
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    dateOfBirth: new Date('1980-01-15'),
    gender: 'male',
    placeOfBirth: {
      city: 'Boston',
      state: 'Massachusetts',
      country: 'USA'
    },
    email: 'john.doe@example.com'
  }
);
```

### Adding Medical Data

```typescript
// Add diagnosis
await patientRepository.addDiagnosis(repositoryId, {
  condition: 'Type 2 Diabetes',
  icd10Code: 'E11.9',
  diagnosedDate: new Date('2020-03-15'),
  status: 'active',
  severity: 'moderate'
});

// Add medication
await patientRepository.addMedication(repositoryId, {
  name: 'Metformin',
  dosage: '500mg',
  frequency: 'Twice daily',
  startDate: new Date('2020-03-15'),
  status: 'active'
});

// Add allergy
await patientRepository.addAllergy(repositoryId, {
  allergen: 'Penicillin',
  type: 'drug',
  reaction: 'Hives',
  severity: 'severe'
});

// Add vital signs
await patientRepository.addVitalSigns(repositoryId, {
  date: new Date(),
  bloodPressure: { systolic: 120, diastolic: 80 },
  heartRate: 72,
  weight: 180,
  height: 70
});
```

### Migrating Account

```typescript
await patientRepository.migrateAccount(
  repositoryId,
  newUserId,
  identityFactors,
  mfaToken
);
```

### Deleting Repository

```typescript
await patientRepository.deleteAndPurgeRepository(
  repositoryId,
  userId,
  confirmationToken
);
```

## Security Best Practices

### For Patients

1. **Protect Your Identity Factors**
   - Never share your DOB, full name, and place of birth together
   - Use strong, unique passwords
   - Enable MFA
   - Keep recovery information secure

2. **Regular Security Checks**
   - Review access logs monthly
   - Check for unauthorized access
   - Update security questions
   - Verify contact information

3. **Account Migration**
   - Only migrate when necessary
   - Verify all identity factors
   - Use secure channels
   - Confirm migration via email

### For Developers

1. **Always Verify Repository Ownership**
   ```typescript
   if (repository.userId !== currentUserId) {
     throw new Error('Unauthorized');
   }
   ```

2. **Never Expose Identity Hashes**
   - Hashes are internal only
   - Never return in API responses
   - Never log in plain text

3. **Encrypt Sensitive Data**
   - Personal information must be encrypted
   - Use strong encryption (AES-256-GCM)
   - Rotate encryption keys regularly

4. **Audit Everything**
   - Log all repository access
   - Log all data modifications
   - Log all migrations and deletions
   - Retain audit logs for compliance

## Compliance & Privacy

### HIPAA Compliance

- ✅ Unique user identification (identity verification)
- ✅ Access control (repository ownership)
- ✅ Audit controls (comprehensive logging)
- ✅ Data integrity (encryption, versioning)
- ✅ Transmission security (HTTPS, encrypted storage)

### GDPR Compliance

- ✅ Right to access (patients see all their data)
- ✅ Right to rectification (patients can update data)
- ✅ Right to erasure (complete deletion & purging)
- ✅ Right to data portability (export functionality)
- ✅ Right to be informed (transparent data usage)

### Data Retention

- **Active Repositories:** Retained indefinitely while account active
- **Deleted Repositories:** Purged immediately
- **Audit Logs:** Retained for 7 years (HIPAA requirement)
- **Backup Data:** Purged within 30 days of deletion

## Conclusion

The HoloVitals Patient Repository system provides:

✅ **True Data Isolation:** Each patient has their own sandboxed repository
✅ **Strong Identity Verification:** Multi-factor identity verification prevents duplicates
✅ **One Repository Per Patient:** Enforced through identity hashing
✅ **Complete Data Ownership:** Patients control their data
✅ **Secure Migration:** Change accounts without losing data
✅ **Complete Deletion:** Irreversible purging when requested
✅ **HIPAA & GDPR Compliant:** Meets all regulatory requirements

This architecture ensures maximum privacy, security, and data ownership for patients while maintaining the flexibility needed for modern healthcare data management.