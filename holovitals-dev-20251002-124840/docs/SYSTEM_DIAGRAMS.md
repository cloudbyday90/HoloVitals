# HoloVitals System Diagrams

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [User Flow Diagrams](#user-flow-diagrams)
3. [AI Processing Flow](#ai-processing-flow)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Infrastructure Diagrams](#infrastructure-diagrams)
6. [Security Architecture](#security-architecture)

---

## High-Level Architecture

### Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                      │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Patient    │  │   Provider   │  │    Admin     │  │  Compliance  │  │
│  │   Portal     │  │   Portal     │  │   Portal     │  │   Officer    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │                  │          │
└─────────┼──────────────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │                  │
          └──────────────────┴──────────────────┴──────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
│                         (Next.js 14 Frontend)                                │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dashboard   │  │     Chat     │  │    Upload    │  │   Settings   │  │
│  │  Component   │  │  Interface   │  │  Component   │  │  Component   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                              │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTPS/TLS 1.3
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY LAYER                                 │
│                    (Azure API Management / AWS API Gateway)                  │
│                                                                              │
│  • Authentication (JWT + MFA)    • Rate Limiting                            │
│  • Request Validation            • Logging & Monitoring                     │
│  • HIPAA Compliance Checks       • DDoS Protection                          │
│                                                                              │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     ▼
┌────────────────────────────────────┐  ┌────────────────────────────────────┐
│     APPLICATION LAYER              │  │      AI PROCESSING LAYER           │
│     (Always Running)               │  │      (Ephemeral)                   │
│                                    │  │                                    │
│  ┌──────────────────────────────┐ │  │  ┌──────────────────────────────┐ │
│  │  Lightweight Chatbot         │ │  │  │  Analysis Queue              │ │
│  │  (GPT-3.5 Turbo)            │ │  │  │  (Priority-based)            │ │
│  │  • <2 sec response          │ │  │  │  • URGENT, HIGH, NORMAL, LOW │ │
│  │  • General queries          │ │  │  └──────────────────────────────┘ │
│  │  • Navigation help          │ │  │              │                     │
│  └──────────────────────────────┘ │  │              ▼                     │
│                                    │  │  ┌──────────────────────────────┐ │
│  ┌──────────────────────────────┐ │  │  │  Context Optimizer           │ │
│  │  Document Processing         │ │  │  │  • Token analysis            │ │
│  │  • Upload handling          │ │  │  │  • Model selection           │ │
│  │  • OCR extraction           │ │  │  │  • Prompt splitting          │ │
│  │  • Metadata extraction      │ │  │  └──────────────────────────────┘ │
│  └──────────────────────────────┘ │  │              │                     │
│                                    │  │              ▼                     │
│  ┌──────────────────────────────┐ │  │  ┌──────────────────────────────┐ │
│  │  User Management             │ │  │  │  Instance Provisioner        │ │
│  │  • Authentication           │ │  │  │  • Spin up GPU instance      │ │
│  │  • Authorization            │ │  │  │  • Load LLM model            │ │
│  │  • Consent management       │ │  │  │  • Execute analysis          │ │
│  └──────────────────────────────┘ │  │  │  • Terminate instance        │ │
│                                    │  │  └──────────────────────────────┘ │
│  ┌──────────────────────────────┐ │  │              │                     │
│  │  HIPAA Compliance            │ │  │              ▼                     │
│  │  • PHI sanitization         │ │  │  ┌──────────────────────────────┐ │
│  │  • Access logging           │ │  │  │  Heavy-Duty Analysis         │ │
│  │  • Audit trail              │ │  │  │  • GPT-4 Turbo               │ │
│  └──────────────────────────────┘ │  │  │  • Claude 3 Opus/Sonnet      │ │
│                                    │  │  │  • Llama 3 70B               │ │
└────────────────────────────────────┘  │  │  • 5-30 min analysis         │ │
                                        │  └──────────────────────────────┘ │
                                        │                                    │
                                        │  Lifecycle: 8-30 minutes           │
                                        │  Auto-terminate after completion   │
                                        └────────────────────────────────────┘
                                                       │
                    ┌──────────────────────────────────┴──────────────────┐
                    │                                                     │
                    ▼                                                     ▼
┌────────────────────────────────────┐  ┌────────────────────────────────────┐
│         DATA LAYER                 │  │      REPOSITORY LAYER              │
│                                    │  │                                    │
│  ┌──────────────────────────────┐ │  │  ┌──────────────────────────────┐ │
│  │  PostgreSQL Database         │ │  │  │  Patient Repository          │ │
│  │  • User data                │ │  │  │  • Sandboxed per patient     │ │
│  │  • Metadata                 │ │  │  │  • Identity-based access     │ │
│  │  • Audit logs               │ │  │  └──────────────────────────────┘ │
│  │  • Queue state              │ │  │                                    │
│  └──────────────────────────────┘ │  │  ┌──────────────────────────────┐ │
│                                    │  │  │  AI Analysis Repository      │ │
│  ┌──────────────────────────────┐ │  │  │  • Analysis results          │ │
│  │  Redis Cache                 │ │  │  │  • Priority queue            │ │
│  │  • Session data             │ │  │  │  • Missing data tracking     │ │
│  │  • Queue management         │ │  │  └──────────────────────────────┘ │
│  │  • Temporary data           │ │  │                                    │
│  └──────────────────────────────┘ │  │  ┌──────────────────────────────┐ │
│                                    │  │  │  AI Context Cache            │ │
│  ┌──────────────────────────────┐ │  │  │  • PHI-sanitized cache       │ │
│  │  Blob Storage                │ │  │  │  • Importance scoring        │ │
│  │  • Medical documents        │ │  │  │  • Smart eviction            │ │
│  │  • Analysis results         │ │  │  └──────────────────────────────┘ │
│  │  • Encrypted backups        │ │  │                                    │
│  └──────────────────────────────┘ │  │  ┌──────────────────────────────┐ │
│                                    │  │  │  HIPAA Compliance Repo       │ │
│  All encrypted with AES-256-GCM   │  │  │  • Compliance rules          │ │
│                                    │  │  │  • Audit logs                │ │
└────────────────────────────────────┘  │  │  • Violation tracking        │ │
                                        │  └──────────────────────────────┘ │
                                        └────────────────────────────────────┘
```

---

## User Flow Diagrams

### 1. New User Onboarding Flow

```
START
  │
  ▼
┌─────────────────────────┐
│  User visits website    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Click "Get Started"    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Identity Verification                              │
│                                                              │
│  Enter:                                                      │
│  • Full Name                                                 │
│  • Date of Birth                                             │
│  • Place of Birth                                            │
│                                                              │
│  [Continue] →                                                │
└───────────┬─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Additional Verification (Optional)                 │
│                                                              │
│  Provide at least 2 of:                                      │
│  ☐ Last 4 digits of SSN                                     │
│  ☐ Mother's Maiden Name                                     │
│  ☐ Medical Record Number                                    │
│  ☐ Previous Address                                         │
│  ☐ Phone Number                                             │
│                                                              │
│  [Skip]  [Continue] →                                        │
└───────────┬─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Health Profile (Optional)                          │
│                                                              │
│  • Current Medications [+ Add]                               │
│  • Known Allergies [+ Add]                                   │
│  • Chronic Conditions [+ Add]                                │
│                                                              │
│  [Skip for now]  [Continue] →                                │
└───────────┬─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Document Upload (Optional)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Drag & drop medical documents here                 │   │
│  │  or click to browse                                 │   │
│  │                                                      │   │
│  │  Supported: PDF, JPG, PNG                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Skip for now]  [Finish Setup] →                           │
└───────────┬─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│  Welcome to Dashboard!  │
│                         │
│  💬 Chat interface      │
│  📄 Upload documents    │
│  ⚙️  Settings           │
└─────────────────────────┘
            │
            ▼
          END
```

### 2. Document Analysis Flow

```
START: User uploads document
  │
  ▼
┌─────────────────────────────────────┐
│  Document Upload Handler            │
│  • Validate file type               │
│  • Check file size                  │
│  • Scan for malware                 │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Document Processing                │
│  • Extract text (OCR if needed)     │
│  • Extract metadata                 │
│  • Identify document type           │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Create Analysis Task               │
│  • Generate task ID                 │
│  • Set priority (NORMAL)            │
│  • Add to queue                     │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Notify User                        │
│  "Your document is being analyzed"  │
│  "Estimated time: 15 minutes"       │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Context Optimizer                  │
│  • Count tokens                     │
│  • Select optimal model             │
│  • Determine if splitting needed    │
└───────────┬─────────────────────────┘
            │
            ├─── Splitting NOT needed ───┐
            │                            │
            │                            ▼
            │              ┌─────────────────────────────────┐
            │              │  Single Analysis                │
            │              │  • Provision 1 instance         │
            │              │  • Load model                   │
            │              │  • Run analysis                 │
            │              │  • Terminate instance           │
            │              └───────────┬─────────────────────┘
            │                          │
            └─── Splitting needed ─────┤
                           │           │
                           ▼           │
            ┌─────────────────────────────────┐
            │  Split Analysis                 │
            │  • Split into chunks            │
            │  • Provision N instances        │
            │  • Run parallel/sequential      │
            │  • Merge results                │
            │  • Terminate instances          │
            └───────────┬─────────────────────┘
                        │
                        └─────────────┬───────┘
                                      │
                                      ▼
                        ┌─────────────────────────────────┐
                        │  PHI Sanitization               │
                        │  • Remove all PHI identifiers   │
                        │  • Validate sanitization        │
                        └───────────┬─────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────────────┐
                        │  Store Results                  │
                        │  • Save to database             │
                        │  • Cache (sanitized)            │
                        │  • Update task status           │
                        └───────────┬─────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────────────┐
                        │  Notify User                    │
                        │  "Analysis complete!"           │
                        │  [View Results]                 │
                        └─────────────────────────────────┘
                                    │
                                    ▼
                                  END
```

### 3. Chat Interaction Flow

```
START: User types message
  │
  ▼
┌─────────────────────────────────────┐
│  Lightweight Chatbot                │
│  • Receive message                  │
│  • Analyze intent                   │
└───────────┬─────────────────────────┘
            │
            ▼
      ┌─────┴─────┐
      │  Decision │
      └─────┬─────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
Simple Query    Complex Query
    │               │
    ▼               ▼
┌─────────────┐  ┌─────────────────────────────────┐
│ GPT-3.5     │  │  Escalate to Deep Analysis      │
│ Response    │  │  • Create analysis task         │
│ <2 seconds  │  │  • Add to queue                 │
└──────┬──────┘  │  • Notify user of wait time     │
       │         └───────────┬─────────────────────┘
       │                     │
       │                     ▼
       │         ┌─────────────────────────────────┐
       │         │  Queue Processing               │
       │         │  (See Document Analysis Flow)   │
       │         └───────────┬─────────────────────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
      ┌─────────────────────┐
      │  Display Response   │
      │  • Show in chat     │
      │  • Save to history  │
      └─────────────────────┘
                  │
                  ▼
                END
```

---

## AI Processing Flow

### Ephemeral Instance Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INSTANCE LIFECYCLE                                │
└─────────────────────────────────────────────────────────────────────┘

PHASE 1: PROVISIONING (2-3 minutes)
┌─────────────────────────────────────┐
│  1. Request instance from cloud     │
│     • Azure: Standard_NC6s_v3       │
│     • AWS: p3.2xlarge               │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  2. Instance starts                 │
│     • Boot OS                       │
│     • Initialize GPU                │
│     • Load Docker container         │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  3. Load model weights              │
│     • Download from secure storage  │
│     • Load into GPU memory          │
│     • Warm up model                 │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  4. Health check                    │
│     • Verify model loaded           │
│     • Test inference                │
│     • Mark as READY                 │
└───────────┬─────────────────────────┘
            │
            ▼

PHASE 2: READY (<1 minute)
┌─────────────────────────────────────┐
│  5. Accept analysis request         │
│     • Receive task from queue       │
│     • Load patient data (encrypted) │
│     • Prepare context               │
└───────────┬─────────────────────────┘
            │
            ▼

PHASE 3: EXECUTING (5-25 minutes)
┌─────────────────────────────────────┐
│  6. Run LLM inference               │
│     • Process input tokens          │
│     • Generate analysis             │
│     • Stream results                │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  7. Validate results                │
│     • Check completeness            │
│     • Verify format                 │
│     • Quality check                 │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  8. Sanitize PHI                    │
│     • Remove all identifiers        │
│     • Validate sanitization         │
│     • Prepare for storage           │
└───────────┬─────────────────────────┘
            │
            ▼

PHASE 4: DEPROVISIONING (<1 minute)
┌─────────────────────────────────────┐
│  9. Save results                    │
│     • Upload to secure storage      │
│     • Update database               │
│     • Notify user                   │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  10. Clear all PHI                  │
│      • Wipe memory                  │
│      • Clear disk                   │
│      • Verify deletion              │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  11. Terminate instance             │
│      • Stop container               │
│      • Deallocate resources         │
│      • Log costs                    │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  12. Cleanup complete               │
│      • Instance terminated          │
│      • Resources released           │
│      • Ready for next task          │
└─────────────────────────────────────┘

TOTAL TIME: 8-30 minutes
COST: $0.12 - $1.53 per analysis
```

---

## Data Flow Diagrams

### Patient Data Flow (HIPAA-Compliant)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PATIENT DATA FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

INPUT: Patient uploads document
  │
  ▼
┌─────────────────────────────────────┐
│  1. Upload Handler                  │
│     • Receive file                  │
│     • Validate format               │
│     • Scan for malware              │
│     ✓ Encrypted in transit (TLS 1.3)│
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  2. Blob Storage                    │
│     • Store encrypted file          │
│     • Generate unique ID            │
│     ✓ Encrypted at rest (AES-256)  │
│     ✓ Access logged                │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  3. Document Processing             │
│     • Extract text (OCR)            │
│     • Extract metadata              │
│     • Identify PHI                  │
│     ✓ Processing in memory only    │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  4. Patient Repository              │
│     • Store metadata                │
│     • Link to blob storage          │
│     ✓ Sandboxed per patient        │
│     ✓ Identity-based access        │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  5. Analysis Queue                  │
│     • Create analysis task          │
│     • Set priority                  │
│     ✓ Task ID logged               │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  6. Ephemeral Instance              │
│     • Load document (encrypted)     │
│     • Run analysis                  │
│     • Generate results              │
│     ✓ PHI in memory only           │
│     ✓ No persistent storage        │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  7. PHI Sanitization                │
│     • Remove all identifiers        │
│     • Validate sanitization         │
│     ✓ Compliance verified          │
└───────────┬─────────────────────────┘
            │
            ├─── Original (with PHI) ───┐
            │                           │
            │                           ▼
            │              ┌─────────────────────────────────┐
            │              │  8a. Secure Storage             │
            │              │      • Store encrypted          │
            │              │      • Patient access only      │
            │              │      ✓ Audit logged            │
            │              └─────────────────────────────────┘
            │
            └─── Sanitized (no PHI) ────┐
                                        │
                                        ▼
                           ┌─────────────────────────────────┐
                           │  8b. Context Cache              │
                           │      • Store for reuse          │
                           │      • Importance scoring       │
                           │      ✓ No PHI present          │
                           └─────────────────────────────────┘
                                        │
                                        ▼
                           ┌─────────────────────────────────┐
                           │  9. Notify Patient              │
                           │     • Analysis complete         │
                           │     • Results available         │
                           │     ✓ Notification logged      │
                           └─────────────────────────────────┘
                                        │
                                        ▼
                                    OUTPUT

✓ = HIPAA Compliance Checkpoint
```

---

## Infrastructure Diagrams

### Cloud Infrastructure (Azure)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INTERNET                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Azure Front Door                                  │
│  • Global load balancing                                             │
│  • DDoS protection                                                   │
│  • WAF (Web Application Firewall)                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Azure API Management                              │
│  • API gateway                                                       │
│  • Rate limiting                                                     │
│  • Authentication                                                    │
│  • Request validation                                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────────┐  ┌──────────────────────────────┐
│   PUBLIC SUBNET           │  │   PRIVATE SUBNET             │
│   (10.0.1.0/24)          │  │   (10.0.2.0/24)             │
│                           │  │                              │
│  ┌─────────────────────┐ │  │  ┌─────────────────────────┐│
│  │ Azure Kubernetes    │ │  │  │ PostgreSQL Flexible     ││
│  │ Service (AKS)       │ │  │  │ Server                  ││
│  │                     │ │  │  │ • Zone redundant        ││
│  │ • Application pods  │ │  │  │ • Geo-replicated        ││
│  │ • Auto-scaling      │ │  │  │ • Encrypted             ││
│  │ • Load balancing    │ │  │  └─────────────────────────┘│
│  └─────────────────────┘ │  │                              │
│                           │  │  ┌─────────────────────────┐│
│  ┌─────────────────────┐ │  │  │ Redis Cache             ││
│  │ Application Gateway │ │  │  │ • Premium tier          ││
│  │ • SSL termination   │ │  │  │ • Persistence enabled   ││
│  │ • Path routing      │ │  │  │ • Geo-replication       ││
│  └─────────────────────┘ │  │  └─────────────────────────┘│
│                           │  │                              │
└───────────────────────────┘  │  ┌─────────────────────────┐│
                               │  │ GPU Instances           ││
                               │  │ (Ephemeral)             ││
                               │  │                         ││
                               │  │ • NC6s_v3 (1x V100)     ││
                               │  │ • NC12s_v3 (2x V100)    ││
                               │  │ • NC24s_v3 (4x V100)    ││
                               │  │                         ││
                               │  │ Lifecycle: 8-30 min     ││
                               │  └─────────────────────────┘│
                               └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    SHARED SERVICES                                   │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Azure Key    │  │ Azure        │  │ Azure        │             │
│  │ Vault        │  │ Monitor      │  │ Storage      │             │
│  │              │  │              │  │ Account      │             │
│  │ • Secrets    │  │ • Logs       │  │              │             │
│  │ • Keys       │  │ • Metrics    │  │ • Blobs      │             │
│  │ • Certs      │  │ • Alerts     │  │ • Queues     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Azure        │  │ Azure        │  │ Azure        │             │
│  │ Container    │  │ Health Data  │  │ Backup       │             │
│  │ Registry     │  │ Services     │  │              │             │
│  │              │  │              │  │ • Daily      │             │
│  │ • Images     │  │ • FHIR API   │  │ • Geo-       │             │
│  │ • Geo-rep    │  │ • DICOM      │  │   redundant  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 1: NETWORK SECURITY                         │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  • DDoS Protection (Azure Front Door)                        │  │
│  │  • WAF (Web Application Firewall)                            │  │
│  │  • Network Security Groups (NSGs)                            │  │
│  │  • Private VNet/VPC                                          │  │
│  │  • No public IPs on backend services                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: APPLICATION SECURITY                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  • TLS 1.3 only                                              │  │
│  │  • Certificate pinning                                       │  │
│  │  • HSTS (HTTP Strict Transport Security)                    │  │
│  │  • CSP (Content Security Policy)                            │  │
│  │  • Rate limiting                                             │  │
│  │  • Input validation                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: AUTHENTICATION                           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  • Multi-Factor Authentication (MFA) required                │  │
│  │  • TOTP-based (Google Authenticator)                         │  │
│  │  • Password strength requirements                            │  │
│  │  • Account lockout (5 failed attempts)                       │  │
│  │  • Session timeout (30 minutes)                              │  │
│  │  • Bcrypt password hashing (12 rounds)                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 4: AUTHORIZATION                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  • Role-Based Access Control (RBAC)                          │  │
│  │  • Minimum necessary principle                               │  │
│  │  • Explicit patient consent required                         │  │
│  │  • Time-limited access (max 72 hours)                        │  │
│  │  • Granular permissions                                      │  │
│  │  • Access revocation                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 5: DATA ENCRYPTION                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  At Rest:                                                     │  │
│  │  • AES-256-GCM encryption                                     │  │
│  │  • Separate keys per patient                                 │  │
│  │  • Key rotation (90 days)                                    │  │
│  │  • Azure Key Vault / AWS KMS                                 │  │
│  │                                                               │  │
│  │  In Transit:                                                  │  │
│  │  • TLS 1.3 only                                              │  │
│  │  • Perfect Forward Secrecy                                   │  │
│  │  • Certificate pinning                                       │  │
│  │                                                               │  │
│  │  In Memory:                                                   │  │
│  │  • Encrypted memory for PHI                                  │  │
│  │  • Memory scrubbing on deallocation                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 6: AUDIT & MONITORING                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  • Complete audit trail                                       │  │
│  │  • All PHI access logged                                      │  │
│  │  • Real-time anomaly detection                                │  │
│  │  • Suspicious activity alerts                                 │  │
│  │  • Compliance monitoring                                      │  │
│  │  • Security incident response                                 │  │
│  │  • Log retention (7 years)                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 7: COMPLIANCE                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  • HIPAA compliance checks                                    │  │
│  │  • PHI sanitization                                           │  │
│  │  • Consent verification                                       │  │
│  │  • Breach notification procedures                             │  │
│  │  • Regular compliance audits                                  │  │
│  │  • Business Associate Agreements (BAAs)                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

These diagrams provide a comprehensive visual representation of the HoloVitals system architecture, including:

1. **High-Level Architecture** - Complete system overview
2. **User Flows** - Onboarding, document analysis, chat interactions
3. **AI Processing** - Ephemeral instance lifecycle
4. **Data Flow** - HIPAA-compliant patient data handling
5. **Infrastructure** - Cloud architecture (Azure/AWS)
6. **Security** - Multi-layer security model

All diagrams emphasize:
- ✅ HIPAA compliance at every layer
- ✅ Encryption everywhere (at rest, in transit, in memory)
- ✅ Ephemeral instances for cost efficiency and security
- ✅ Complete audit trails
- ✅ Multi-layer security
- ✅ Scalability and high availability

Use these diagrams for:
- Team onboarding
- Architecture reviews
- Compliance audits
- Stakeholder presentations
- Development planning