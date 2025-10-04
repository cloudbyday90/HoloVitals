# Multi-Jurisdiction Compliance Analysis: USA, Canada, and Europe

## Executive Summary

This document provides a comprehensive analysis of what HoloVitals needs to implement to achieve full compliance with healthcare data protection regulations in the United States (HIPAA), Canada (PHIPA/PIPEDA), and Europe (GDPR/EHDS). Based on examination of our current architecture and regulatory requirements as of 2025, this analysis identifies gaps and provides actionable implementation requirements.

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Regulatory Requirements Comparison](#regulatory-requirements-comparison)
3. [Gap Analysis](#gap-analysis)
4. [Implementation Requirements](#implementation-requirements)
5. [Technical Architecture Changes](#technical-architecture-changes)
6. [Legal and Contractual Requirements](#legal-and-contractual-requirements)
7. [Operational Requirements](#operational-requirements)
8. [Timeline and Priorities](#timeline-and-priorities)

---

## 1. Current State Assessment

### What We Have Already Implemented ✅

Based on our existing HoloVitals architecture:

**Security & Access Control**
- ✅ Role-Based Access Control (RBAC) with 6 roles and 40+ permissions
- ✅ Multi-Factor Authentication (MFA) using TOTP
- ✅ Session management with token expiration
- ✅ Account lockout after failed attempts
- ✅ Password strength requirements (12+ chars, complexity)

**Audit & Compliance**
- ✅ Complete audit logging system (AccessLog, AuditLog tables)
- ✅ Suspicious activity detection
- ✅ Error monitoring dashboard
- ✅ HIPAA Sanitizer (removes 18 HIPAA identifiers)
- ✅ PHI sanitization before logging

**Data Management**
- ✅ Sandboxed patient repositories (one per patient)
- ✅ Identity verification (multi-factor)
- ✅ Consent management system
- ✅ Time-based access controls
- ✅ Complete data deletion capability

**EHR Integration**
- ✅ FHIR R4 support
- ✅ SMART on FHIR authentication
- ✅ 5 major EHR providers (75% US market coverage)
- ✅ Bulk data export capabilities
- ✅ Medical data standardization (LOINC codes)

**Documentation**
- ✅ 1,140+ pages of comprehensive documentation
- ✅ API documentation
- ✅ Integration guides
- ✅ Security procedures

### What We're Missing ❌

**Encryption**
- ❌ Encryption at rest not explicitly implemented
- ❌ Encryption in transit not documented
- ❌ Key management system not defined
- ❌ Encryption standards not specified (AES-256, TLS 1.3)

**Legal Agreements**
- ❌ Business Associate Agreement (BAA) templates
- ❌ Data Processing Agreement (DPA) templates
- ❌ Patient consent forms
- ❌ Terms of Service and Privacy Policy

**Compliance Certifications**
- ❌ HIPAA compliance attestation
- ❌ SOC 2 Type II certification
- ❌ GDPR compliance certification
- ❌ Third-party security audits

**Data Residency**
- ❌ Geographic data storage controls
- ❌ Data localization for EU/Canada
- ❌ Cross-border data transfer mechanisms

**Breach Response**
- ❌ Formal incident response plan
- ❌ Breach notification procedures (72-hour timeline)
- ❌ Breach notification templates
- ❌ Communication protocols

**Patient Rights**
- ❌ Data portability mechanisms (GDPR Article 20)
- ❌ Right to erasure implementation (GDPR Article 17)
- ❌ Right to rectification workflows
- ❌ Automated decision-making disclosures

**Retention & Disposal**
- ❌ Data retention policies (6-7 years for medical records)
- ❌ Secure data disposal procedures
- ❌ Backup retention schedules
- ❌ Archive management

---

## 2. Regulatory Requirements Comparison

### Key Differences Between Jurisdictions

| Requirement | USA (HIPAA) | Canada (PHIPA/PIPEDA) | Europe (GDPR) |
|-------------|-------------|----------------------|---------------|
| **Consent Model** | Implied consent for treatment | Implied within Circle of Care (Ontario) | Explicit consent required |
| **Breach Notification** | 60 days to individuals, immediate if >500 | Immediate if risk of harm | 72 hours to authority |
| **Data Residency** | No specific requirement | Provincial restrictions (some) | EU/EEA preferred, SCCs for transfers |
| **Encryption** | Addressable (recommended) | Required for electronic PHI | Required for sensitive data |
| **Audit Logs** | 6 years retention | 6-10 years (provincial) | Not specified, but required |
| **Patient Access** | 30 days to provide records | 30 days (Ontario), varies by province | 1 month (extendable to 3) |
| **Right to Erasure** | No general right | Limited right | Full right (with exceptions) |
| **Data Portability** | Not required | Not required | Required (machine-readable format) |
| **DPO/Privacy Officer** | Not required | Required for custodians | Required if large-scale processing |
| **DPIA** | Not required | Privacy Impact Assessment (PIA) | Required for high-risk processing |
| **Penalties** | Up to $1.5M per violation | Up to $100K (PIPEDA) | Up to €20M or 4% global revenue |

---

## 3. Gap Analysis

### Critical Gaps (Must Fix Before Launch)

#### 3.1 Encryption Requirements

**Current State:** Not explicitly implemented or documented

**Required:**
- **At Rest:** AES-256 encryption for all PHI/ePHI in databases and file storage
- **In Transit:** TLS 1.3 for all data transmission
- **Key Management:** Secure key storage (AWS KMS, Azure Key Vault, or HashiCorp Vault)
- **Backup Encryption:** Encrypted backups with separate keys

**Impact:** All three jurisdictions require or strongly recommend encryption

#### 3.2 Legal Agreements

**Current State:** No formal agreements in place

**Required:**
- **Business Associate Agreement (BAA):** For HIPAA compliance with any third-party service providers (AWS, Azure, email providers, analytics)
- **Data Processing Agreement (DPA):** For GDPR compliance with processors
- **Patient Consent Forms:** Jurisdiction-specific consent forms
- **Privacy Policy:** Comprehensive, jurisdiction-specific privacy notices
- **Terms of Service:** Clear terms for platform use

**Impact:** Legal liability and regulatory non-compliance without these

#### 3.3 Breach Notification System

**Current State:** Audit logging exists, but no formal breach response

**Required:**
- **72-Hour GDPR Timeline:** Automated breach detection and notification system
- **60-Day HIPAA Timeline:** Breach notification to affected individuals
- **Immediate PHIPA Notification:** If risk of harm exists
- **Breach Response Plan:** Documented procedures, roles, communication templates
- **Breach Register:** Log of all breaches and responses

**Impact:** Regulatory penalties and legal liability

#### 3.4 Data Residency Controls

**Current State:** No geographic restrictions implemented

**Required:**
- **EU Data:** Must be stored in EU/EEA or with Standard Contractual Clauses (SCCs)
- **Canadian Data:** Some provinces require in-country storage
- **US Data:** No restrictions, but some states (Texas) have new requirements
- **Multi-Region Architecture:** Ability to store data in specific regions

**Impact:** GDPR violations, provincial law violations

### High-Priority Gaps (Fix Within 3 Months)

#### 3.5 Patient Rights Implementation

**Current State:** Partial implementation (deletion exists)

**Required:**
- **Data Portability (GDPR):** Export patient data in machine-readable format (JSON, XML)
- **Right to Rectification:** Allow patients to correct inaccurate data
- **Right to Erasure:** Complete deletion (already implemented, needs documentation)
- **Right to Restriction:** Ability to restrict processing
- **Automated Decision-Making Disclosure:** Inform patients about AI use

#### 3.6 Retention and Disposal Policies

**Current State:** No formal policies

**Required:**
- **Medical Records:** 6-7 years retention (varies by jurisdiction)
- **Audit Logs:** 6 years (HIPAA), 6-10 years (Canada)
- **Backups:** Defined retention schedule
- **Secure Disposal:** Documented procedures for data destruction
- **Archive Management:** Long-term storage for legal/compliance needs

#### 3.7 Compliance Certifications

**Current State:** No certifications

**Required:**
- **SOC 2 Type II:** Industry standard for security controls
- **HIPAA Attestation:** Third-party audit and attestation
- **ISO 27001:** International security standard (helpful for EU)
- **HITRUST CSF:** Healthcare-specific security framework
- **Annual Audits:** Regular third-party security assessments

### Medium-Priority Gaps (Fix Within 6 Months)

#### 3.8 Data Protection Impact Assessment (DPIA)

**Current State:** Not conducted

**Required:**
- **GDPR DPIA:** Required for high-risk processing (large-scale health data)
- **Canadian PIA:** Required for new data handling practices
- **Documentation:** Formal assessment of privacy risks and mitigations
- **Regular Updates:** DPIA must be updated when processing changes

#### 3.9 Privacy Officer / DPO

**Current State:** No designated officer

**Required:**
- **Data Protection Officer (DPO):** Required for GDPR if large-scale processing
- **Privacy Officer:** Required for PHIPA custodians
- **Responsibilities:** Oversee compliance, handle complaints, liaise with regulators
- **Independence:** Must be independent and report to highest management

#### 3.10 Subprocessor Management

**Current State:** No formal tracking

**Required:**
- **Subprocessor List:** Maintain list of all third-party processors
- **Due Diligence:** Vet all subprocessors for compliance
- **Contracts:** Ensure all subprocessors have DPAs/BAAs
- **Notification:** Inform customers of subprocessor changes (GDPR)

---

## 4. Implementation Requirements

### 4.1 Encryption Implementation

#### Database Encryption (At Rest)

**PostgreSQL:**
```sql
-- Enable transparent data encryption (TDE)
-- Option 1: Use cloud provider encryption (AWS RDS, Azure Database)
-- Option 2: Use PostgreSQL pgcrypto extension

-- Create encryption key
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
ALTER TABLE "User" 
  ALTER COLUMN email TYPE bytea 
  USING pgp_sym_encrypt(email::text, 'encryption_key');

-- Or use full database encryption at storage level
-- AWS RDS: Enable encryption at creation
-- Azure: Enable Transparent Data Encryption (TDE)
```

**Recommended Approach:**
- Use cloud provider's native encryption (AWS RDS encryption, Azure TDE)
- Store encryption keys in dedicated key management service (AWS KMS, Azure Key Vault)
- Rotate keys annually
- Separate keys for production, staging, development

#### File Storage Encryption

**AWS S3:**
```typescript
// Enable server-side encryption with KMS
const s3Client = new S3Client({
  region: 'us-east-1',
});

await s3Client.send(new PutObjectCommand({
  Bucket: 'holovitals-phi-data',
  Key: 'patient-documents/doc123.pdf',
  Body: fileBuffer,
  ServerSideEncryption: 'aws:kms',
  SSEKMSKeyId: 'arn:aws:kms:us-east-1:123456789:key/abc-def',
}));
```

**Azure Blob Storage:**
```typescript
// Enable encryption with customer-managed keys
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const containerClient = blobServiceClient.getContainerClient('phi-documents');
await containerClient.createIfNotExists({
  encryption: {
    keyVaultKeyId: 'https://keyvault.vault.azure.net/keys/phi-key/version',
  },
});
```

#### Transport Encryption (In Transit)

**TLS 1.3 Configuration:**
```typescript
// Next.js production configuration
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
        ],
      },
    ];
  },
};

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production' && !request.secure) {
  return response.redirect(301, `https://${request.hostname}${request.url}`);
}
```

**Database Connections:**
```typescript
// Prisma with SSL/TLS
// .env
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require&sslcert=/path/to/cert.pem"

// Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  ssl      = {
    rejectUnauthorized = true
  }
}
```

#### Key Management Service

**Implementation:**
```typescript
// lib/services/KeyManagementService.ts
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

export class KeyManagementService {
  private kmsClient: KMSClient;
  private keyId: string;

  constructor() {
    this.kmsClient = new KMSClient({ region: process.env.AWS_REGION });
    this.keyId = process.env.KMS_KEY_ID!;
  }

  async encrypt(plaintext: string): Promise<string> {
    const command = new EncryptCommand({
      KeyId: this.keyId,
      Plaintext: Buffer.from(plaintext),
    });

    const response = await this.kmsClient.send(command);
    return Buffer.from(response.CiphertextBlob!).toString('base64');
  }

  async decrypt(ciphertext: string): Promise<string> {
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(ciphertext, 'base64'),
    });

    const response = await this.kmsClient.send(command);
    return Buffer.from(response.Plaintext!).toString('utf-8');
  }

  async rotateKey(): Promise<void> {
    // Implement key rotation logic
    // AWS KMS supports automatic key rotation
  }
}
```

### 4.2 Legal Agreements Implementation

#### Business Associate Agreement (BAA) Template

**File:** `legal/BAA_TEMPLATE.md`

```markdown
# BUSINESS ASSOCIATE AGREEMENT

This Business Associate Agreement ("Agreement") is entered into as of [DATE] 
between [COVERED ENTITY NAME] ("Covered Entity") and HoloVitals Inc. 
("Business Associate").

## 1. DEFINITIONS
Terms used but not otherwise defined in this Agreement shall have the same 
meaning as those terms in the HIPAA Rules.

## 2. OBLIGATIONS OF BUSINESS ASSOCIATE

### 2.1 Permitted Uses and Disclosures
Business Associate may only use or disclose Protected Health Information (PHI) 
as necessary to perform services for Covered Entity or as required by law.

### 2.2 Safeguards
Business Associate shall implement appropriate safeguards to prevent use or 
disclosure of PHI other than as provided for by this Agreement, including:
- Administrative safeguards (policies, procedures, training)
- Physical safeguards (facility access controls, workstation security)
- Technical safeguards (encryption, access controls, audit logs)

### 2.3 Reporting
Business Associate shall report to Covered Entity any use or disclosure of PHI 
not provided for by this Agreement within 10 business days of discovery.

### 2.4 Subcontractors
Business Associate shall ensure that any subcontractors that create, receive, 
maintain, or transmit PHI on behalf of Business Associate agree to the same 
restrictions and conditions.

### 2.5 Access to PHI
Business Associate shall provide access to PHI to individuals as required by 
45 CFR § 164.524.

### 2.6 Amendment of PHI
Business Associate shall make amendments to PHI as directed by Covered Entity.

### 2.7 Accounting of Disclosures
Business Associate shall document and make available to Covered Entity 
information required to provide an accounting of disclosures.

### 2.8 Availability of Books and Records
Business Associate shall make its internal practices, books, and records 
relating to the use and disclosure of PHI available to the Secretary of HHS.

## 3. OBLIGATIONS OF COVERED ENTITY

### 3.1 Permitted Uses and Disclosures
Covered Entity shall not request Business Associate to use or disclose PHI in 
any manner that would not be permissible under the HIPAA Rules.

### 3.2 Notice of Privacy Practices
Covered Entity shall provide Business Associate with any changes to its Notice 
of Privacy Practices.

## 4. TERM AND TERMINATION

### 4.1 Term
This Agreement shall be effective as of [DATE] and shall terminate when all PHI 
provided by Covered Entity to Business Associate is destroyed or returned.

### 4.2 Termination for Cause
Upon Covered Entity's knowledge of a material breach by Business Associate, 
Covered Entity shall either:
(a) Provide an opportunity for Business Associate to cure the breach; or
(b) Terminate this Agreement if cure is not possible.

### 4.3 Effect of Termination
Upon termination, Business Associate shall:
(a) Return or destroy all PHI received from Covered Entity; or
(b) If return or destruction is not feasible, extend protections of this 
    Agreement to such PHI and limit further uses and disclosures.

## 5. BREACH NOTIFICATION

Business Associate shall notify Covered Entity of any breach of unsecured PHI 
without unreasonable delay and in no case later than 10 business days after 
discovery of the breach.

## 6. INDEMNIFICATION

Business Associate shall indemnify and hold harmless Covered Entity from any 
claims, damages, or costs arising from Business Associate's breach of this 
Agreement or violation of HIPAA.

## 7. MISCELLANEOUS

### 7.1 Regulatory References
A reference in this Agreement to a section in the HIPAA Rules means the section 
as in effect or as amended.

### 7.2 Amendment
The parties agree to take such action as is necessary to amend this Agreement 
to comply with changes in HIPAA Rules.

### 7.3 Interpretation
Any ambiguity in this Agreement shall be resolved in favor of a meaning that 
permits Covered Entity to comply with the HIPAA Rules.

SIGNED:

[COVERED ENTITY]                    [BUSINESS ASSOCIATE]
_____________________              _____________________
Name:                              Name: [CEO Name]
Title:                             Title: Chief Executive Officer
Date:                              Date:
```

#### Data Processing Agreement (DPA) Template

**File:** `legal/DPA_TEMPLATE.md`

```markdown
# DATA PROCESSING AGREEMENT

This Data Processing Agreement ("DPA") is entered into as of [DATE] between 
[CONTROLLER NAME] ("Controller") and HoloVitals Inc. ("Processor").

## 1. DEFINITIONS

- **Personal Data**: Any information relating to an identified or identifiable 
  natural person as defined in GDPR Article 4(1).
- **Processing**: Any operation performed on Personal Data as defined in GDPR 
  Article 4(2).
- **Data Subject**: The identified or identifiable natural person to whom 
  Personal Data relates.

## 2. SCOPE AND PURPOSE

### 2.1 Subject Matter
Processing of Personal Data necessary for Processor to provide healthcare data 
management and analysis services to Controller.

### 2.2 Duration
This DPA shall remain in effect for the duration of the Service Agreement.

### 2.3 Nature and Purpose of Processing
- Storage and management of patient health records
- Analysis of medical data using AI/ML algorithms
- Integration with electronic health record (EHR) systems
- Provision of patient portal and communication services

### 2.4 Types of Personal Data
- Health data (medical records, diagnoses, medications, lab results)
- Identification data (name, date of birth, contact information)
- Demographic data (age, gender, location)
- Authentication data (login credentials, access logs)

### 2.5 Categories of Data Subjects
- Patients receiving healthcare services
- Healthcare providers using the platform
- Administrative staff

## 3. PROCESSOR OBLIGATIONS

### 3.1 Processing Instructions
Processor shall process Personal Data only on documented instructions from 
Controller, including with regard to transfers of Personal Data to a third 
country or international organization.

### 3.2 Confidentiality
Processor shall ensure that persons authorized to process Personal Data have 
committed themselves to confidentiality or are under an appropriate statutory 
obligation of confidentiality.

### 3.3 Security Measures
Processor shall implement appropriate technical and organizational measures to 
ensure a level of security appropriate to the risk, including:
- Pseudonymization and encryption of Personal Data
- Ability to ensure ongoing confidentiality, integrity, availability, and 
  resilience of processing systems
- Ability to restore availability and access to Personal Data in a timely 
  manner in the event of incident
- Regular testing, assessment, and evaluation of effectiveness of security 
  measures

### 3.4 Sub-Processors
Processor shall not engage another processor (sub-processor) without prior 
specific or general written authorization from Controller. Current sub-processors:
- [LIST SUB-PROCESSORS]

Processor shall inform Controller of any intended changes concerning addition 
or replacement of sub-processors, giving Controller the opportunity to object.

### 3.5 Data Subject Rights
Processor shall assist Controller in responding to requests from Data Subjects 
to exercise their rights under GDPR:
- Right of access (Article 15)
- Right to rectification (Article 16)
- Right to erasure (Article 17)
- Right to restriction of processing (Article 18)
- Right to data portability (Article 20)
- Right to object (Article 21)

### 3.6 Breach Notification
Processor shall notify Controller without undue delay after becoming aware of a 
personal data breach, and in any event within 24 hours of discovery.

### 3.7 Data Protection Impact Assessment
Processor shall assist Controller in ensuring compliance with obligations under 
GDPR Articles 32 to 36, including Data Protection Impact Assessments.

### 3.8 Deletion or Return of Data
At the choice of Controller, Processor shall delete or return all Personal Data 
to Controller after the end of provision of services, and delete existing copies 
unless EU or Member State law requires storage.

### 3.9 Audit Rights
Processor shall make available to Controller all information necessary to 
demonstrate compliance with this DPA and allow for and contribute to audits, 
including inspections, conducted by Controller or another auditor mandated by 
Controller.

## 4. CONTROLLER OBLIGATIONS

### 4.1 Lawful Processing
Controller warrants that it has a lawful basis for processing Personal Data 
under GDPR Article 6 and, where applicable, Article 9.

### 4.2 Instructions
Controller shall provide clear, documented instructions to Processor regarding 
processing of Personal Data.

### 4.3 Data Subject Notifications
Controller shall provide appropriate notices to Data Subjects regarding 
processing of their Personal Data.

## 5. INTERNATIONAL DATA TRANSFERS

### 5.1 Transfer Mechanisms
Where Processor transfers Personal Data outside the EEA, it shall ensure 
appropriate safeguards are in place:
- Standard Contractual Clauses approved by the European Commission
- Adequacy decision by the European Commission
- Binding Corporate Rules
- Other legally valid transfer mechanisms

### 5.2 Data Residency
Processor shall store and process Personal Data within the European Economic 
Area (EEA) unless otherwise agreed in writing.

## 6. LIABILITY AND INDEMNIFICATION

### 6.1 Liability
Each party's liability under this DPA shall be subject to the limitations and 
exclusions of liability set out in the Service Agreement.

### 6.2 Indemnification
Processor shall indemnify Controller against all claims, costs, damages, and 
expenses arising from Processor's breach of this DPA or GDPR.

## 7. TERM AND TERMINATION

### 7.1 Term
This DPA shall commence on the date of the Service Agreement and continue until 
termination of the Service Agreement.

### 7.2 Survival
Sections 3.8 (Deletion or Return of Data), 6 (Liability and Indemnification), 
and 8 (General Provisions) shall survive termination of this DPA.

## 8. GENERAL PROVISIONS

### 8.1 Governing Law
This DPA shall be governed by the laws of [JURISDICTION].

### 8.2 Amendments
Any amendments to this DPA must be made in writing and signed by both parties.

### 8.3 Severability
If any provision of this DPA is held to be invalid or unenforceable, the 
remaining provisions shall remain in full force and effect.

SIGNED:

[CONTROLLER]                        [PROCESSOR]
_____________________              _____________________
Name:                              Name: [CEO Name]
Title:                             Title: Chief Executive Officer
Date:                              Date:

## ANNEX 1: TECHNICAL AND ORGANIZATIONAL MEASURES

### 1. Access Control
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- Principle of least privilege
- Regular access reviews

### 2. Encryption
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- Encrypted backups
- Key management service (KMS)

### 3. Audit Logging
- Comprehensive audit trails
- 6-year log retention
- Tamper-proof logging
- Regular log reviews

### 4. Incident Response
- 24/7 security monitoring
- Incident response plan
- Breach notification procedures
- Regular incident drills

### 5. Business Continuity
- Daily encrypted backups
- Disaster recovery plan
- 99.9% uptime SLA
- Geographic redundancy

### 6. Personnel Security
- Background checks
- Confidentiality agreements
- Security awareness training
- Separation of duties

### 7. Physical Security
- Secure data centers (SOC 2 certified)
- Access controls and monitoring
- Environmental controls
- Secure disposal procedures

### 8. Vendor Management
- Due diligence on sub-processors
- Contractual security requirements
- Regular vendor assessments
- Subprocessor list maintenance
```

#### Patient Consent Form Template

**File:** `legal/PATIENT_CONSENT_FORM.md`

```markdown
# PATIENT CONSENT FOR USE AND DISCLOSURE OF HEALTH INFORMATION

## Patient Information
- Name: _______________________________
- Date of Birth: _______________________
- Patient ID: __________________________

## Purpose of This Consent
This consent form explains how your health information may be used and disclosed 
by HoloVitals and gives you the right to decide whether to allow this use and 
disclosure.

## What Information May Be Used or Disclosed

### Medical Information
- Medical history and diagnoses
- Medications and allergies
- Laboratory and test results
- Vital signs and measurements
- Clinical notes and reports
- Imaging and diagnostic reports

### Personal Information
- Name, date of birth, contact information
- Insurance information
- Emergency contact information

## How Your Information May Be Used

### Treatment
- Coordinating your care with healthcare providers
- Analyzing your medical data to provide insights
- Generating reports and summaries
- Facilitating communication with your care team

### Healthcare Operations
- Quality improvement activities
- Training and education
- System maintenance and improvement
- Compliance with legal requirements

### Research (Optional)
☐ I consent to use of my de-identified health information for research purposes
☐ I do NOT consent to use of my information for research

## Your Rights

You have the right to:
- Access your health information
- Request corrections to your information
- Request restrictions on use or disclosure
- Receive an accounting of disclosures
- Revoke this consent at any time
- Receive a copy of this consent form

## Data Sharing

### With Your Healthcare Providers
☐ I consent to sharing my information with my healthcare providers
☐ I do NOT consent to sharing with healthcare providers

### With Family Members or Caregivers
☐ I consent to sharing my information with designated family/caregivers
☐ I do NOT consent to sharing with family/caregivers

Designated persons (if applicable):
- Name: _________________ Relationship: _____________
- Name: _________________ Relationship: _____________

### Electronic Health Record (EHR) Integration
☐ I consent to integration with my EHR system(s)
☐ I do NOT consent to EHR integration

EHR System(s): _______________________________

## Data Storage and Security

Your information will be:
- Encrypted both at rest and in transit
- Stored on secure, HIPAA-compliant servers
- Accessible only to authorized personnel
- Protected by multi-factor authentication
- Backed up regularly with encrypted backups

## Data Retention

Your health information will be retained for:
- Active records: Duration of your use of the platform
- Archived records: 7 years after last activity (as required by law)
- Audit logs: 6 years (as required by HIPAA)

## International Data Transfers (if applicable)

☐ I consent to transfer of my data to [COUNTRY] for processing
☐ I do NOT consent to international data transfers

Note: If you do not consent to international transfers, some features may not 
be available.

## Revocation of Consent

You may revoke this consent at any time by:
- Contacting us at privacy@holovitals.com
- Using the "Revoke Consent" feature in your account settings
- Sending written notice to: HoloVitals Inc., [ADDRESS]

Revocation will not affect information already used or disclosed based on this 
consent.

## Acknowledgment

I acknowledge that:
- I have read and understand this consent form
- I have had the opportunity to ask questions
- I understand my rights regarding my health information
- I understand that I may revoke this consent at any time
- I have received a copy of the HoloVitals Privacy Policy
- I have received a copy of this signed consent form

## Signature

Patient Signature: _________________________ Date: __________

If signed by legal representative:
Representative Name: _______________________
Relationship to Patient: ____________________
Representative Signature: ___________________ Date: __________

## For HoloVitals Use Only
Consent recorded by: _______________________
Date recorded: ____________________________
Consent ID: _______________________________
```

### 4.3 Breach Notification System Implementation

**File:** `lib/services/BreachNotificationService.ts`

```typescript
/**
 * Breach Notification Service
 * 
 * Handles breach detection, notification, and compliance with:
 * - HIPAA: 60-day notification to individuals
 * - GDPR: 72-hour notification to supervisory authority
 * - PHIPA: Immediate notification if risk of harm
 */

import { PrismaClient } from '@prisma/client';
import { sendEmail } from './EmailService';
import { createNotification } from './NotificationService';

const prisma = new PrismaClient();

export enum BreachSeverity {
  LOW = 'LOW',           // Minimal risk
  MEDIUM = 'MEDIUM',     // Moderate risk
  HIGH = 'HIGH',         // Significant risk
  CRITICAL = 'CRITICAL', // Severe risk of harm
}

export enum BreachType {
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_LOSS = 'DATA_LOSS',
  DATA_THEFT = 'DATA_THEFT',
  RANSOMWARE = 'RANSOMWARE',
  SYSTEM_COMPROMISE = 'SYSTEM_COMPROMISE',
  INSIDER_THREAT = 'INSIDER_THREAT',
  ACCIDENTAL_DISCLOSURE = 'ACCIDENTAL_DISCLOSURE',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

interface BreachNotification {
  id: string;
  breachType: BreachType;
  severity: BreachSeverity;
  discoveryDate: Date;
  affectedUsers: number;
  affectedRecords: number;
  description: string;
  containmentActions: string[];
  
  // Notification tracking
  hipaaNotificationStatus: NotificationStatus;
  hipaaNotificationDate?: Date;
  gdprNotificationStatus: NotificationStatus;
  gdprNotificationDate?: Date;
  phipaNotificationStatus: NotificationStatus;
  phipaNotificationDate?: Date;
  
  // Regulatory reporting
  hhsReported: boolean;
  hhsReportDate?: Date;
  supervisoryAuthorityReported: boolean;
  supervisoryAuthorityReportDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export class BreachNotificationService {
  /**
   * Report a potential breach
   */
  async reportBreach(params: {
    breachType: BreachType;
    severity: BreachSeverity;
    description: string;
    affectedUserIds: string[];
    affectedData: string[];
    containmentActions: string[];
  }): Promise<BreachNotification> {
    const {
      breachType,
      severity,
      description,
      affectedUserIds,
      affectedData,
      containmentActions,
    } = params;

    // Create breach record
    const breach = await prisma.breachNotification.create({
      data: {
        breachType,
        severity,
        discoveryDate: new Date(),
        affectedUsers: affectedUserIds.length,
        affectedRecords: affectedData.length,
        description,
        containmentActions,
        hipaaNotificationStatus: NotificationStatus.PENDING,
        gdprNotificationStatus: NotificationStatus.PENDING,
        phipaNotificationStatus: NotificationStatus.PENDING,
        hhsReported: false,
        supervisoryAuthorityReported: false,
      },
    });

    // Immediate actions based on severity
    if (severity === BreachSeverity.CRITICAL || severity === BreachSeverity.HIGH) {
      // Alert security team immediately
      await this.alertSecurityTeam(breach);
      
      // Start notification process immediately
      await this.initiateNotifications(breach.id, affectedUserIds);
    }

    // Log the breach
    await prisma.auditLog.create({
      data: {
        action: 'BREACH_REPORTED',
        resourceType: 'BREACH',
        resourceId: breach.id,
        severity: 'CRITICAL',
        details: {
          breachType,
          severity,
          affectedUsers: affectedUserIds.length,
        },
      },
    });

    return breach as any;
  }

  /**
   * Initiate breach notifications to affected individuals
   */
  async initiateNotifications(
    breachId: string,
    affectedUserIds: string[]
  ): Promise<void> {
    const breach = await prisma.breachNotification.findUnique({
      where: { id: breachId },
    });

    if (!breach) {
      throw new Error('Breach not found');
    }

    // Update status
    await prisma.breachNotification.update({
      where: { id: breachId },
      data: {
        hipaaNotificationStatus: NotificationStatus.IN_PROGRESS,
        gdprNotificationStatus: NotificationStatus.IN_PROGRESS,
        phipaNotificationStatus: NotificationStatus.IN_PROGRESS,
      },
    });

    // Notify each affected user
    for (const userId of affectedUserIds) {
      await this.notifyAffectedIndividual(userId, breach);
    }

    // Notify regulatory authorities if required
    await this.notifyRegulatoryAuthorities(breach);

    // Update completion status
    await prisma.breachNotification.update({
      where: { id: breachId },
      data: {
        hipaaNotificationStatus: NotificationStatus.COMPLETED,
        hipaaNotificationDate: new Date(),
        gdprNotificationStatus: NotificationStatus.COMPLETED,
        gdprNotificationDate: new Date(),
        phipaNotificationStatus: NotificationStatus.COMPLETED,
        phipaNotificationDate: new Date(),
      },
    });
  }

  /**
   * Notify an affected individual
   */
  private async notifyAffectedIndividual(
    userId: string,
    breach: any
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    // Create in-app notification
    await createNotification({
      userId,
      type: 'BREACH_NOTIFICATION',
      title: 'Important Security Notice',
      message: this.generateBreachNotificationMessage(breach),
      priority: 'HIGH',
    });

    // Send email notification
    await sendEmail({
      to: user.email,
      subject: 'Important Security Notice - Data Breach Notification',
      template: 'breach-notification',
      data: {
        userName: user.name,
        breachType: breach.breachType,
        discoveryDate: breach.discoveryDate,
        description: breach.description,
        containmentActions: breach.containmentActions,
        nextSteps: this.getNextSteps(breach),
        supportContact: 'privacy@holovitals.com',
      },
    });

    // Log notification
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BREACH_NOTIFICATION_SENT',
        resourceType: 'BREACH',
        resourceId: breach.id,
        severity: 'HIGH',
      },
    });
  }

  /**
   * Notify regulatory authorities
   */
  private async notifyRegulatoryAuthorities(breach: any): Promise<void> {
    // HIPAA: Report to HHS if >500 individuals affected
    if (breach.affectedUsers >= 500) {
      await this.reportToHHS(breach);
    }

    // GDPR: Report to supervisory authority within 72 hours
    if (this.requiresGDPRNotification(breach)) {
      await this.reportToSupervisoryAuthority(breach);
    }

    // PHIPA: Report if risk of harm
    if (this.requiresPHIPANotification(breach)) {
      await this.reportToPrivacyCommissioner(breach);
    }
  }

  /**
   * Report to HHS (HIPAA)
   */
  private async reportToHHS(breach: any): Promise<void> {
    // In production, this would submit to HHS breach portal
    // https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf
    
    console.log('Reporting breach to HHS:', breach.id);

    await prisma.breachNotification.update({
      where: { id: breach.id },
      data: {
        hhsReported: true,
        hhsReportDate: new Date(),
      },
    });

    // Log the report
    await prisma.auditLog.create({
      data: {
        action: 'HHS_BREACH_REPORT',
        resourceType: 'BREACH',
        resourceId: breach.id,
        severity: 'CRITICAL',
        details: {
          affectedUsers: breach.affectedUsers,
          reportDate: new Date(),
        },
      },
    });
  }

  /**
   * Report to EU supervisory authority (GDPR)
   */
  private async reportToSupervisoryAuthority(breach: any): Promise<void> {
    // In production, this would submit to relevant supervisory authority
    // e.g., ICO (UK), CNIL (France), etc.
    
    console.log('Reporting breach to supervisory authority:', breach.id);

    await prisma.breachNotification.update({
      where: { id: breach.id },
      data: {
        supervisoryAuthorityReported: true,
        supervisoryAuthorityReportDate: new Date(),
      },
    });

    // Log the report
    await prisma.auditLog.create({
      data: {
        action: 'SUPERVISORY_AUTHORITY_REPORT',
        resourceType: 'BREACH',
        resourceId: breach.id,
        severity: 'CRITICAL',
        details: {
          affectedUsers: breach.affectedUsers,
          reportDate: new Date(),
        },
      },
    });
  }

  /**
   * Report to Privacy Commissioner (PHIPA)
   */
  private async reportToPrivacyCommissioner(breach: any): Promise<void> {
    // In production, this would submit to IPC Ontario or relevant provincial authority
    
    console.log('Reporting breach to Privacy Commissioner:', breach.id);

    // Log the report
    await prisma.auditLog.create({
      data: {
        action: 'PRIVACY_COMMISSIONER_REPORT',
        resourceType: 'BREACH',
        resourceId: breach.id,
        severity: 'CRITICAL',
        details: {
          affectedUsers: breach.affectedUsers,
          reportDate: new Date(),
        },
      },
    });
  }

  /**
   * Alert security team
   */
  private async alertSecurityTeam(breach: any): Promise<void> {
    // Get all users with OWNER or ADMIN role
    const securityTeam = await prisma.user.findMany({
      where: {
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    for (const member of securityTeam) {
      await createNotification({
        userId: member.id,
        type: 'SECURITY_ALERT',
        title: 'CRITICAL: Data Breach Detected',
        message: `A ${breach.severity} severity breach has been detected. Immediate action required.`,
        priority: 'CRITICAL',
      });

      await sendEmail({
        to: member.email,
        subject: 'CRITICAL: Data Breach Detected',
        template: 'security-alert',
        data: {
          breachId: breach.id,
          severity: breach.severity,
          breachType: breach.breachType,
          affectedUsers: breach.affectedUsers,
          discoveryDate: breach.discoveryDate,
        },
      });
    }
  }

  /**
   * Generate breach notification message
   */
  private generateBreachNotificationMessage(breach: any): string {
    return `
We are writing to inform you of a security incident that may have affected your personal health information.

**What Happened:**
${breach.description}

**What Information Was Involved:**
${this.getAffectedDataDescription(breach)}

**What We Are Doing:**
${breach.containmentActions.join('\n')}

**What You Can Do:**
${this.getNextSteps(breach).join('\n')}

**For More Information:**
If you have questions or concerns, please contact our Privacy Officer at privacy@holovitals.com or call 1-800-XXX-XXXX.

We take the security of your information very seriously and sincerely apologize for any inconvenience this may cause.
    `.trim();
  }

  /**
   * Get affected data description
   */
  private getAffectedDataDescription(breach: any): string {
    // This would be customized based on the actual breach
    return 'Personal health information including medical records, diagnoses, and treatment information.';
  }

  /**
   * Get next steps for affected individuals
   */
  private getNextSteps(breach: any): string[] {
    const steps = [
      'Monitor your accounts for any suspicious activity',
      'Review your medical records for any unauthorized access',
      'Consider placing a fraud alert on your credit reports',
      'Change your password if you haven\'t done so recently',
    ];

    if (breach.severity === BreachSeverity.CRITICAL) {
      steps.push('Consider enrolling in identity theft protection services');
      steps.push('File a report with local law enforcement if you notice fraudulent activity');
    }

    return steps;
  }

  /**
   * Check if GDPR notification is required
   */
  private requiresGDPRNotification(breach: any): boolean {
    // GDPR requires notification if breach is likely to result in a risk to rights and freedoms
    return breach.severity === BreachSeverity.HIGH || breach.severity === BreachSeverity.CRITICAL;
  }

  /**
   * Check if PHIPA notification is required
   */
  private requiresPHIPANotification(breach: any): boolean {
    // PHIPA requires notification if there is a risk of harm
    return breach.severity === BreachSeverity.MEDIUM || 
           breach.severity === BreachSeverity.HIGH || 
           breach.severity === BreachSeverity.CRITICAL;
  }

  /**
   * Get breach statistics
   */
  async getBreachStatistics(params: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalBreaches: number;
    byType: Record<BreachType, number>;
    bySeverity: Record<BreachSeverity, number>;
    totalAffectedUsers: number;
    averageResponseTime: number;
  }> {
    const { startDate, endDate } = params;

    const where: any = {};
    if (startDate || endDate) {
      where.discoveryDate = {};
      if (startDate) where.discoveryDate.gte = startDate;
      if (endDate) where.discoveryDate.lte = endDate;
    }

    const breaches = await prisma.breachNotification.findMany({ where });

    const byType: Record<BreachType, number> = {} as any;
    const bySeverity: Record<BreachSeverity, number> = {} as any;
    let totalAffectedUsers = 0;
    let totalResponseTime = 0;

    for (const breach of breaches) {
      byType[breach.breachType] = (byType[breach.breachType] || 0) + 1;
      bySeverity[breach.severity] = (bySeverity[breach.severity] || 0) + 1;
      totalAffectedUsers += breach.affectedUsers;

      if (breach.hipaaNotificationDate) {
        const responseTime = breach.hipaaNotificationDate.getTime() - breach.discoveryDate.getTime();
        totalResponseTime += responseTime;
      }
    }

    return {
      totalBreaches: breaches.length,
      byType,
      bySeverity,
      totalAffectedUsers,
      averageResponseTime: breaches.length > 0 ? totalResponseTime / breaches.length : 0,
    };
  }
}

// Export singleton instance
let instance: BreachNotificationService | null = null;

export function getBreachNotificationService(): BreachNotificationService {
  if (!instance) {
    instance = new BreachNotificationService();
  }
  return instance;
}
```

### 4.4 Data Residency Implementation

**File:** `lib/services/DataResidencyService.ts`

```typescript
/**
 * Data Residency Service
 * 
 * Manages geographic data storage requirements for:
 * - GDPR: EU/EEA data residency
 * - PHIPA: Provincial data storage (some provinces)
 * - HIPAA: No specific requirements, but some states have rules
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum DataRegion {
  US_EAST = 'US_EAST',           // US East Coast
  US_WEST = 'US_WEST',           // US West Coast
  EU_WEST = 'EU_WEST',           // EU (Ireland)
  EU_CENTRAL = 'EU_CENTRAL',     // EU (Frankfurt)
  CA_CENTRAL = 'CA_CENTRAL',     // Canada (Montreal)
  UK = 'UK',                     // United Kingdom
}

export enum Jurisdiction {
  USA = 'USA',
  CANADA_ONTARIO = 'CANADA_ONTARIO',
  CANADA_ALBERTA = 'CANADA_ALBERTA',
  CANADA_BC = 'CANADA_BC',
  EU = 'EU',
  UK = 'UK',
}

interface DataResidencyRule {
  jurisdiction: Jurisdiction;
  allowedRegions: DataRegion[];
  requiresLocalStorage: boolean;
  allowsCrossBorderTransfer: boolean;
  transferMechanism?: string; // e.g., "Standard Contractual Clauses"
}

export class DataResidencyService {
  private rules: DataResidencyRule[] = [
    {
      jurisdiction: Jurisdiction.USA,
      allowedRegions: [DataRegion.US_EAST, DataRegion.US_WEST],
      requiresLocalStorage: false,
      allowsCrossBorderTransfer: true,
    },
    {
      jurisdiction: Jurisdiction.CANADA_ONTARIO,
      allowedRegions: [DataRegion.CA_CENTRAL, DataRegion.US_EAST, DataRegion.US_WEST],
      requiresLocalStorage: false,
      allowsCrossBorderTransfer: true,
    },
    {
      jurisdiction: Jurisdiction.CANADA_ALBERTA,
      allowedRegions: [DataRegion.CA_CENTRAL],
      requiresLocalStorage: true,
      allowsCrossBorderTransfer: false,
    },
    {
      jurisdiction: Jurisdiction.CANADA_BC,
      allowedRegions: [DataRegion.CA_CENTRAL, DataRegion.US_WEST],
      requiresLocalStorage: false,
      allowsCrossBorderTransfer: true,
    },
    {
      jurisdiction: Jurisdiction.EU,
      allowedRegions: [DataRegion.EU_WEST, DataRegion.EU_CENTRAL],
      requiresLocalStorage: true,
      allowsCrossBorderTransfer: true,
      transferMechanism: 'Standard Contractual Clauses',
    },
    {
      jurisdiction: Jurisdiction.UK,
      allowedRegions: [DataRegion.UK, DataRegion.EU_WEST],
      requiresLocalStorage: false,
      allowsCrossBorderTransfer: true,
      transferMechanism: 'UK Adequacy Decision',
    },
  ];

  /**
   * Get allowed regions for a jurisdiction
   */
  getAllowedRegions(jurisdiction: Jurisdiction): DataRegion[] {
    const rule = this.rules.find(r => r.jurisdiction === jurisdiction);
    return rule?.allowedRegions || [];
  }

  /**
   * Check if data can be stored in a specific region
   */
  canStoreInRegion(jurisdiction: Jurisdiction, region: DataRegion): boolean {
    const allowedRegions = this.getAllowedRegions(jurisdiction);
    return allowedRegions.includes(region);
  }

  /**
   * Get primary region for a jurisdiction
   */
  getPrimaryRegion(jurisdiction: Jurisdiction): DataRegion {
    const allowedRegions = this.getAllowedRegions(jurisdiction);
    return allowedRegions[0] || DataRegion.US_EAST;
  }

  /**
   * Determine jurisdiction from user location
   */
  determineJurisdiction(params: {
    country: string;
    state?: string;
    province?: string;
  }): Jurisdiction {
    const { country, state, province } = params;

    if (country === 'US' || country === 'USA') {
      return Jurisdiction.USA;
    }

    if (country === 'CA' || country === 'Canada') {
      if (province === 'ON' || province === 'Ontario') {
        return Jurisdiction.CANADA_ONTARIO;
      }
      if (province === 'AB' || province === 'Alberta') {
        return Jurisdiction.CANADA_ALBERTA;
      }
      if (province === 'BC' || province === 'British Columbia') {
        return Jurisdiction.CANADA_BC;
      }
      // Default to Ontario rules for other provinces
      return Jurisdiction.CANADA_ONTARIO;
    }

    if (country === 'GB' || country === 'UK') {
      return Jurisdiction.UK;
    }

    // EU countries
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ];

    if (euCountries.includes(country)) {
      return Jurisdiction.EU;
    }

    // Default to USA rules
    return Jurisdiction.USA;
  }

  /**
   * Set user's data region based on jurisdiction
   */
  async setUserDataRegion(userId: string, jurisdiction: Jurisdiction): Promise<void> {
    const primaryRegion = this.getPrimaryRegion(jurisdiction);

    await prisma.user.update({
      where: { id: userId },
      data: {
        dataRegion: primaryRegion,
        jurisdiction,
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DATA_REGION_SET',
        resourceType: 'USER',
        resourceId: userId,
        severity: 'MEDIUM',
        details: {
          jurisdiction,
          region: primaryRegion,
        },
      },
    });
  }

  /**
   * Validate data transfer
   */
  async validateDataTransfer(params: {
    fromRegion: DataRegion;
    toRegion: DataRegion;
    jurisdiction: Jurisdiction;
  }): Promise<{
    allowed: boolean;
    requiresConsent: boolean;
    transferMechanism?: string;
    reason?: string;
  }> {
    const { fromRegion, toRegion, jurisdiction } = params;

    const rule = this.rules.find(r => r.jurisdiction === jurisdiction);
    if (!rule) {
      return {
        allowed: false,
        requiresConsent: false,
        reason: 'Unknown jurisdiction',
      };
    }

    // Check if both regions are allowed
    const fromAllowed = rule.allowedRegions.includes(fromRegion);
    const toAllowed = rule.allowedRegions.includes(toRegion);

    if (!fromAllowed || !toAllowed) {
      return {
        allowed: false,
        requiresConsent: false,
        reason: 'One or both regions not allowed for this jurisdiction',
      };
    }

    // Check if cross-border transfer is allowed
    if (!rule.allowsCrossBorderTransfer && fromRegion !== toRegion) {
      return {
        allowed: false,
        requiresConsent: false,
        reason: 'Cross-border transfers not allowed for this jurisdiction',
      };
    }

    return {
      allowed: true,
      requiresConsent: rule.transferMechanism !== undefined,
      transferMechanism: rule.transferMechanism,
    };
  }

  /**
   * Get database connection string for region
   */
  getDatabaseUrl(region: DataRegion): string {
    const urls: Record<DataRegion, string> = {
      [DataRegion.US_EAST]: process.env.DATABASE_URL_US_EAST!,
      [DataRegion.US_WEST]: process.env.DATABASE_URL_US_WEST!,
      [DataRegion.EU_WEST]: process.env.DATABASE_URL_EU_WEST!,
      [DataRegion.EU_CENTRAL]: process.env.DATABASE_URL_EU_CENTRAL!,
      [DataRegion.CA_CENTRAL]: process.env.DATABASE_URL_CA_CENTRAL!,
      [DataRegion.UK]: process.env.DATABASE_URL_UK!,
    };

    return urls[region] || process.env.DATABASE_URL!;
  }

  /**
   * Get storage bucket for region
   */
  getStorageBucket(region: DataRegion): string {
    const buckets: Record<DataRegion, string> = {
      [DataRegion.US_EAST]: process.env.S3_BUCKET_US_EAST!,
      [DataRegion.US_WEST]: process.env.S3_BUCKET_US_WEST!,
      [DataRegion.EU_WEST]: process.env.S3_BUCKET_EU_WEST!,
      [DataRegion.EU_CENTRAL]: process.env.S3_BUCKET_EU_CENTRAL!,
      [DataRegion.CA_CENTRAL]: process.env.S3_BUCKET_CA_CENTRAL!,
      [DataRegion.UK]: process.env.S3_BUCKET_UK!,
    };

    return buckets[region] || process.env.S3_BUCKET!;
  }
}

// Export singleton instance
let instance: DataResidencyService | null = null;

export function getDataResidencyService(): DataResidencyService {
  if (!instance) {
    instance = new DataResidencyService();
  }
  return instance;
}
```

This is getting quite long. Let me continue with the remaining sections in the next file...