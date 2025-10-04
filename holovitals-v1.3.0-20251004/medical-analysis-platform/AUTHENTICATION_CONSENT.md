# HoloVitals Authentication & Consent Management System

## Overview

HoloVitals implements a comprehensive authentication and consent management system that ensures:
- **Patient Privacy:** Only patients can access their own data
- **Secure Authentication:** Multi-factor authentication (MFA) required
- **Explicit Consent:** Specialists need patient approval for access
- **Time-Based Access:** All specialist access expires automatically
- **No Data Export:** Data cannot be exported from the controlled environment
- **Complete Audit Trail:** All access is logged and monitored

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Patient Account                           │
│  • Login with email + password + MFA                        │
│  • View all personal data (transparent)                     │
│  • Manage consent requests                                  │
│  • View access logs                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Authentication Service                          │
│  • Password hashing (bcrypt)                                │
│  • JWT token management                                     │
│  • MFA with TOTP (Google Authenticator)                     │
│  • Session management                                       │
│  • Account lockout protection                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           Consent Management Service                         │
│  • Explicit patient consent required                        │
│  • Time-based access (max 72 hours)                         │
│  • Granular permissions                                     │
│  • Automatic expiration                                     │
│  • Revocation capability                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 Audit Logger                                 │
│  • Logs all access to PHI/PII                               │
│  • Who, what, when, where, why                              │
│  • Suspicious activity detection                            │
│  • HIPAA compliance reporting                               │
└─────────────────────────────────────────────────────────────┘
```

## Authentication System

### Features

#### 1. Secure Registration
```typescript
const user = await authService.register({
  email: 'patient@example.com',
  password: 'SecureP@ssw0rd123!',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1980-01-01')
});
```

**Password Requirements:**
- Minimum 12 characters
- Must contain uppercase letters
- Must contain lowercase letters
- Must contain numbers
- Must contain special characters

#### 2. Multi-Factor Authentication (MFA)

**Setup MFA:**
```typescript
// Generate MFA secret and QR code
const mfaSetup = await authService.setupMFA(userId);

// Returns:
// - secret: Base32 secret for manual entry
// - qrCode: QR code data URL for scanning
// - backupCodes: 10 one-time backup codes
```

**Enable MFA:**
```typescript
// Verify token from authenticator app
await authService.enableMFA(userId, '123456');
```

**Login with MFA:**
```typescript
const tokens = await authService.login({
  email: 'patient@example.com',
  password: 'SecureP@ssw0rd123!',
  mfaToken: '123456' // From authenticator app
});
```

#### 3. Session Management

**Session Features:**
- 15-minute access token expiry
- 7-day refresh token expiry
- 30-minute session timeout
- Automatic session cleanup
- IP address and user agent tracking

**Token Refresh:**
```typescript
const newTokens = await authService.refreshToken(refreshToken);
```

**Logout:**
```typescript
await authService.logout(sessionId);
```

#### 4. Account Security

**Account Lockout:**
- Maximum 5 failed login attempts
- 15-minute lockout period
- Automatic unlock after timeout

**Password Change:**
```typescript
await authService.changePassword(
  userId,
  'currentPassword',
  'newSecurePassword'
);
// Invalidates all sessions except current
```

## Consent Management System

### Consent Workflow

```
1. Specialist Requests Access
   ↓
2. Patient Receives Notification
   ↓
3. Patient Reviews Request
   ↓
4. Patient Approves/Denies
   ↓
5. If Approved: Time-Limited Access Granted
   ↓
6. All Access is Logged
   ↓
7. Access Expires Automatically
   ↓
8. Patient Can Revoke Anytime
```

### Requesting Consent

**Specialist Request:**
```typescript
const consentId = await consentManagementService.requestConsent({
  patientId: 'patient-uuid',
  specialistId: 'specialist-uuid',
  reason: 'Need to review recent bloodwork results to correct data entry error in hemoglobin value',
  requestedPermissions: [
    {
      resource: 'test_results',
      action: 'read',
      scope: 'bloodwork-doc-id'
    },
    {
      resource: 'test_results',
      action: 'correct',
      scope: 'bloodwork-doc-id'
    }
  ],
  requestedDuration: 24, // hours
  urgency: 'routine'
});
```

**Permission Types:**

| Resource | Actions | Description |
|----------|---------|-------------|
| `documents` | read | View documents |
| `test_results` | read, correct | View/fix test results |
| `medications` | read | View medications |
| `allergies` | read | View allergies |
| `conditions` | read | View conditions |
| `imaging` | read | View imaging results |
| `clinical_notes` | read, annotate | View/add notes |
| `all_phi` | read | Full PHI access |

### Patient Consent Actions

**Approve Consent:**
```typescript
const consent = await consentManagementService.approveConsent(
  consentId,
  patientId,
  [
    // Optional: Add custom restrictions
    {
      type: 'ip_restricted',
      value: ['192.168.1.100'],
      description: 'Access only from clinic IP'
    }
  ]
);
```

**Deny Consent:**
```typescript
await consentManagementService.denyConsent(
  consentId,
  patientId,
  'Not comfortable sharing this information'
);
```

**Revoke Active Consent:**
```typescript
await consentManagementService.revokeConsent(
  consentId,
  patientId,
  'No longer needed'
);
// Immediately terminates all specialist sessions
```

### Access Restrictions

**Default Restrictions (Always Applied):**
1. **No Export:** Data cannot be exported from the system
2. **No Copy:** Data cannot be copied to clipboard
3. **Session Only:** Access only during active session

**Optional Restrictions:**
- **IP Restricted:** Specific IP addresses only
- **Device Restricted:** Specific devices only
- **View Only:** Read-only, no modifications
- **No Print:** Cannot print data

### Consent Limits

- **Maximum Duration:** 72 hours
- **Minimum Duration:** 1 hour
- **Expiration Warning:** 2 hours before expiry
- **Automatic Expiration:** Access terminates at expiry time

### Checking Permissions

```typescript
const hasPermission = await consentManagementService.checkPermission(
  specialistId,
  patientId,
  'test_results',
  'read'
);

if (hasPermission) {
  // Allow access
  await consentManagementService.logAccess(
    consentId,
    specialistId,
    'view_test_results',
    'bloodwork-doc-id',
    ipAddress,
    userAgent
  );
} else {
  // Deny access
  await auditLogger.logUnauthorizedAccess(
    specialistId,
    'test_results',
    'No active consent',
    ipAddress,
    userAgent
  );
}
```

## Audit Logging

### What Gets Logged

**Authentication Events:**
- Login success/failure
- Logout
- MFA enabled/disabled
- Password changes
- Account lockouts

**Data Access Events:**
- Data viewed
- Data created
- Data updated
- Data deleted
- Data exported (blocked but logged)
- Data printed (blocked but logged)

**Consent Events:**
- Consent requested
- Consent approved
- Consent denied
- Consent revoked

**Specialist Access Events:**
- Access granted
- Access denied
- Data viewed
- Data corrected

**Security Events:**
- System errors
- Security violations
- Unauthorized access attempts
- Suspicious activity

### Logging PHI/PII Access

```typescript
await auditLogger.logPHIAccess(
  userId,
  patientId,
  'bloodwork_results',
  'view',
  consentId,
  ipAddress,
  userAgent
);
```

### Logging Specialist Access

```typescript
await auditLogger.logSpecialistAccess(
  specialistId,
  patientId,
  'corrected_hemoglobin_value',
  consentId,
  {
    field: 'hemoglobin',
    oldValue: '14.5',
    newValue: '15.2',
    reason: 'Data entry error'
  },
  ipAddress,
  userAgent
);
```

### Suspicious Activity Detection

The system automatically detects:
- **Rapid Repeated Access:** >20 actions in 5 minutes
- **Multiple IP Addresses:** >3 IPs in 1 hour
- **Unusual Access Times:** 2 AM - 5 AM data access
- **Failed Login Patterns:** Multiple failed attempts
- **Unauthorized Access Attempts:** Accessing without permission

### Audit Reports

```typescript
const report = await auditLogger.generateReport(
  startDate,
  endDate
);

// Returns:
// - totalEntries
// - entriesBySeverity (low, medium, high, critical)
// - entriesByAction
// - suspiciousActivities
// - requiresReview
// - dateRange
```

### User Activity Summary

```typescript
const summary = await auditLogger.getUserActivitySummary(
  userId,
  30 // days
);

// Returns:
// - totalActions
// - actionCounts
// - dailyActivity
// - securityViolations
// - unauthorizedAttempts
```

## Patient Data Transparency

### What Patients Can See

Patients have **complete transparency** into:

1. **All Their Data:**
   - Medical documents
   - Test results
   - Medications
   - Allergies
   - Conditions
   - Clinical notes

2. **All Access Logs:**
   - Who accessed their data
   - When it was accessed
   - What was accessed
   - Why it was accessed (consent reason)

3. **All Consent Requests:**
   - Pending requests
   - Approved consents
   - Denied requests
   - Revoked consents
   - Expired consents

4. **All Audit Logs:**
   - Every action on their account
   - Login history
   - Data modifications
   - System events

### Patient Dashboard Features

```typescript
// Get all patient data
const data = await getPatientData(patientId);

// Get all consent requests
const consents = await consentManagementService.getPatientConsents(patientId);

// Get all access logs
const accessLogs = await auditLogger.getPatientAuditLogs(patientId);

// Get all notifications
const notifications = await getPatientNotifications(patientId);
```

## Security Controls

### Data Export Prevention

**Technical Controls:**
1. **No Export API:** No endpoints allow data export
2. **Clipboard Blocking:** JavaScript prevents copy operations
3. **Print Blocking:** CSS prevents printing
4. **Screenshot Detection:** Warns on screenshot attempts
5. **Right-Click Disabled:** Context menu disabled on sensitive data

**Audit Controls:**
1. All export attempts are logged
2. Alerts sent on export attempts
3. Automatic session termination on violations

### Session Security

**Controls:**
- Session timeout after 30 minutes of inactivity
- Automatic logout on browser close
- Session invalidation on password change
- IP address validation
- User agent validation

### Access Warnings

**Warnings Displayed:**
```
⚠️ WARNING: PHI/PII ACCESS
You are accessing Protected Health Information (PHI).
All access is logged and monitored.
Unauthorized access or data export is prohibited.
Consent expires in: 23 hours 45 minutes
```

## HIPAA Compliance

### Compliance Features

1. **Access Control:**
   - Unique user identification
   - Emergency access procedures (consent system)
   - Automatic logoff (session timeout)
   - Encryption and decryption

2. **Audit Controls:**
   - Audit logs for all PHI access
   - Audit log protection (immutable)
   - Audit log review procedures
   - Audit log retention (7 years)

3. **Integrity:**
   - Data integrity verification
   - Data modification logging
   - Data correction procedures (consent-based)

4. **Person or Entity Authentication:**
   - Multi-factor authentication
   - Password requirements
   - Session management

5. **Transmission Security:**
   - HTTPS/TLS encryption
   - Secure token transmission
   - Encrypted data storage

### Compliance Reporting

```typescript
// Generate HIPAA compliance report
const report = await generateHIPAAComplianceReport(
  startDate,
  endDate
);

// Includes:
// - All PHI access events
// - All consent grants
// - All security violations
// - All audit log reviews
// - Compliance metrics
```

## Implementation Example

### Complete Patient Login Flow

```typescript
// 1. Patient registers
const user = await authService.register({
  email: 'patient@example.com',
  password: 'SecureP@ssw0rd123!',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1980-01-01')
});

// 2. Patient sets up MFA
const mfaSetup = await authService.setupMFA(user.id);
// Display QR code to patient
// Patient scans with authenticator app

// 3. Patient verifies MFA
await authService.enableMFA(user.id, '123456');

// 4. Patient logs in
const tokens = await authService.login({
  email: 'patient@example.com',
  password: 'SecureP@ssw0rd123!',
  mfaToken: '654321'
}, ipAddress, userAgent);

// 5. Patient accesses dashboard
// All data is visible and transparent
```

### Complete Specialist Access Flow

```typescript
// 1. Specialist requests access
const consentId = await consentManagementService.requestConsent({
  patientId: 'patient-uuid',
  specialistId: 'specialist-uuid',
  reason: 'Need to review and correct data entry error',
  requestedPermissions: [
    { resource: 'test_results', action: 'read' },
    { resource: 'test_results', action: 'correct' }
  ],
  requestedDuration: 24,
  urgency: 'routine'
});

// 2. Patient receives notification
// Patient reviews request in dashboard

// 3. Patient approves
await consentManagementService.approveConsent(
  consentId,
  'patient-uuid'
);

// 4. Specialist accesses data
const hasPermission = await consentManagementService.checkPermission(
  'specialist-uuid',
  'patient-uuid',
  'test_results',
  'read'
);

if (hasPermission) {
  // Log access
  await consentManagementService.logAccess(
    consentId,
    'specialist-uuid',
    'view_test_results',
    'doc-id',
    ipAddress,
    userAgent
  );
  
  // Show data with warnings
  displayDataWithWarnings(data);
}

// 5. Specialist corrects data
await consentManagementService.logAccess(
  consentId,
  'specialist-uuid',
  'correct_test_result',
  'doc-id',
  ipAddress,
  userAgent,
  { field: 'hemoglobin', oldValue: '14.5', newValue: '15.2' }
);

// 6. Access expires automatically after 24 hours
// Or patient can revoke anytime
await consentManagementService.revokeConsent(
  consentId,
  'patient-uuid',
  'Issue resolved'
);
```

## Best Practices

### For Patients

1. **Enable MFA:** Always enable multi-factor authentication
2. **Strong Passwords:** Use unique, strong passwords
3. **Review Consents:** Regularly review consent requests
4. **Check Access Logs:** Monitor who accessed your data
5. **Revoke Promptly:** Revoke consent when no longer needed

### For Specialists

1. **Minimal Access:** Request only necessary permissions
2. **Clear Reasons:** Provide detailed access reasons
3. **Time-Limited:** Request shortest duration needed
4. **Document Actions:** Log all data corrections
5. **Respect Privacy:** Never export or share data

### For Administrators

1. **Monitor Alerts:** Review security alerts daily
2. **Audit Reviews:** Review high-severity logs weekly
3. **Compliance Reports:** Generate monthly compliance reports
4. **Update Policies:** Keep security policies current
5. **Train Users:** Regular security training

## Conclusion

The HoloVitals authentication and consent management system provides:
- ✅ Secure patient authentication with MFA
- ✅ Complete patient data transparency
- ✅ Explicit consent for specialist access
- ✅ Time-based access controls
- ✅ Comprehensive audit logging
- ✅ HIPAA compliance
- ✅ No data export capability
- ✅ Suspicious activity detection

This system ensures that patient data remains private and secure while allowing necessary specialist access under controlled, audited conditions.