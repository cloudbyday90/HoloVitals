# Development & QA Repository System

## 🚀 Quick Start

The Development & QA Repository System is a comprehensive framework for managing bugs, features, and development projects in HoloVitals.

### What's Included

- **Bug Repository** - Track and manage bugs from detection to resolution
- **Development & Enhancement Repository** - Plan features and manage roadmaps
- **Development & QA Processing Repository** - Manage development projects and deployments
- **Repository Coordinator** - Orchestrate workflows across all repositories
- **Notification Service** - Multi-channel notifications for all events

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Examples](#quick-examples)
- [Documentation](#documentation)
- [API Reference](#api-reference)
- [Contributing](#contributing)

---

## ✨ Features

### Bug Repository
- ✅ Multi-source bug detection (user reports, system monitoring, automated tests)
- ✅ Intelligent auto-triage and prioritization
- ✅ Bug lifecycle management (NEW → TRIAGED → IN_PROGRESS → FIXED → CLOSED)
- ✅ Duplicate detection and merging
- ✅ Impact analysis and severity scoring
- ✅ Complete audit trail

### Development & Enhancement Repository
- ✅ Feature request tracking and voting
- ✅ Impact analysis (technical, business, resource)
- ✅ Roadmap planning and visualization
- ✅ Dependency mapping
- ✅ Task breakdown and tracking
- ✅ Community engagement through voting

### Development & QA Processing Repository
- ✅ Multi-environment management (Dev, QA, Staging, Production)
- ✅ Automated deployment pipeline
- ✅ Comprehensive testing integration
- ✅ Code change tracking
- ✅ Rollback capabilities
- ✅ Environment health monitoring

### Repository Coordinator
- ✅ Automated workflows (bug → enhancement → project)
- ✅ Cross-repository data flow
- ✅ System health monitoring
- ✅ Comprehensive reporting
- ✅ High-priority item tracking

### Notification Service
- ✅ Multi-channel support (Email, In-App, Slack, SMS, Webhooks)
- ✅ Customizable preferences
- ✅ Priority-based routing
- ✅ Bulk notifications
- ✅ Event-driven architecture

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  DevQA Repository Coordinator                    │
│              (Orchestrates All Repository Interactions)          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
    │ Bug Repository   │ │ Dev & Enhancement│ │ Dev & QA Process │
    │                  │ │   Repository     │ │   Repository     │
    └──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Prisma CLI

### Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Database**
```bash
# Copy environment template
cp .env.example .env

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/holovitals"
```

3. **Run Migrations**
```bash
npx prisma migrate dev
```

4. **Generate Prisma Client**
```bash
npx prisma generate
```

5. **Start Development Server**
```bash
npm run dev
```

---

## 🎯 Quick Examples

### Report a Bug

```typescript
import BugRepositoryService from './services/BugRepositoryService';

const bugService = new BugRepositoryService();

const bug = await bugService.reportBug({
  title: "Login page crashes on mobile",
  description: "Users report crashes when accessing login page from mobile devices",
  source: "USER_REPORT",
  severity: "HIGH",
  category: "UI_UX",
  reportedBy: "user123",
  environment: "PRODUCTION",
  stepsToReproduce: "1. Open mobile browser\n2. Navigate to login\n3. Page crashes",
  expectedBehavior: "Login page should load",
  actualBehavior: "Page crashes with error"
});

console.log(`Bug created: ${bug.id}`);
```

### Submit a Feature Request

```typescript
import DevelopmentEnhancementService from './services/DevelopmentEnhancementService';

const enhancementService = new DevelopmentEnhancementService();

const feature = await enhancementService.submitFeatureRequest({
  title: "Add dark mode support",
  description: "Implement dark mode across the application",
  type: "NEW_FEATURE",
  priority: "MEDIUM",
  requestedBy: "user456",
  businessValue: "Improves user experience and accessibility",
  estimatedEffort: 120,
  complexity: 7,
  tags: ["ui", "accessibility"]
});

console.log(`Feature created: ${feature.id}`);
```

### Create and Deploy a Project

```typescript
import DevQAProcessingService from './services/DevQAProcessingService';

const devQAService = new DevQAProcessingService();

// Create project
const project = await devQAService.createProject({
  name: "Fix mobile login crash",
  description: "Fix the mobile login page crash issue",
  type: "BUG_FIX",
  sourceType: "BUG",
  sourceId: "bug_123"
});

// Deploy to QA
await devQAService.deploy(project.id, {
  environment: "QA",
  version: "1.0.1-qa",
  branch: "fix/mobile-login",
  deployedBy: "dev_789"
});

// Run tests
const testResult = await devQAService.runTests(project.id, {
  environment: "QA",
  testSuite: "full",
  testType: "INTEGRATION"
});

console.log(`Tests ${testResult.success ? 'passed' : 'failed'}`);
```

### Use the Coordinator for Full Workflow

```typescript
import DevQARepositoryCoordinator from './services/DevQARepositoryCoordinator';

const coordinator = new DevQARepositoryCoordinator();

// Process bug through entire workflow
const result = await coordinator.processBugReport({
  title: "Critical security vulnerability",
  description: "SQL injection vulnerability detected",
  source: "SECURITY_SCAN",
  severity: "CRITICAL",
  category: "SECURITY"
});

if (result.success) {
  console.log('Bug processed and project created');
  console.log(`Bug ID: ${result.data.bug.id}`);
  console.log(`Project ID: ${result.data.project.id}`);
}
```

---

## 📚 Documentation

### Core Documentation
- **[Architecture Overview](docs/DEV_QA_REPOSITORY_ARCHITECTURE.md)** - System architecture and design
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Integration Guide](docs/INTEGRATION_GUIDE.md)** - Integration patterns and examples
- **[Workflow Examples](docs/WORKFLOW_EXAMPLES.md)** - Real-world usage scenarios
- **[System Summary](docs/DEV_QA_SYSTEM_SUMMARY.md)** - Complete system overview

### Database Schema
- **[Schema Documentation](prisma/schema-dev-qa-repositories.prisma)** - Complete database schema

### Service Documentation
- **BugRepositoryService** - Bug tracking and management
- **DevelopmentEnhancementService** - Feature planning and roadmaps
- **DevQAProcessingService** - Development and deployment
- **DevQARepositoryCoordinator** - Workflow orchestration
- **NotificationService** - Multi-channel notifications

---

## 🔌 API Reference

### Bug Repository API

**Report Bug**
```http
POST /api/bugs
Content-Type: application/json

{
  "title": "Bug title",
  "description": "Bug description",
  "severity": "HIGH",
  "category": "UI_UX"
}
```

**Get Bug**
```http
GET /api/bugs/:bugId
```

**Update Bug Status**
```http
PATCH /api/bugs/:bugId/status
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "userId": "dev_123"
}
```

### Enhancement Repository API

**Submit Feature**
```http
POST /api/features
Content-Type: application/json

{
  "title": "Feature title",
  "description": "Feature description",
  "type": "NEW_FEATURE",
  "priority": "MEDIUM"
}
```

**Get Impact Analysis**
```http
GET /api/features/:featureId/impact
```

### Development & QA API

**Create Project**
```http
POST /api/projects
Content-Type: application/json

{
  "name": "Project name",
  "type": "BUG_FIX",
  "sourceId": "bug_123"
}
```

**Deploy**
```http
POST /api/projects/:projectId/deploy
Content-Type: application/json

{
  "environment": "QA",
  "version": "1.0.0",
  "deployedBy": "dev_123"
}
```

**Run Tests**
```http
POST /api/projects/:projectId/tests
Content-Type: application/json

{
  "environment": "QA",
  "testSuite": "full",
  "testType": "INTEGRATION"
}
```

For complete API documentation, see [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

## 🔄 Workflows

### Bug Fix Workflow
```
User Reports Bug → Auto-Triage → Assignment → 
Development → Testing → Deployment → Resolution
```

### Feature Development Workflow
```
Feature Request → Impact Analysis → Approval → 
Roadmap → Development → Testing → Deployment → Completion
```

### Emergency Response Workflow
```
Critical Issue Detected → Immediate Alert → 
Fast-Track Project → Emergency Fix → Deployment → Verification
```

For detailed workflow examples, see [WORKFLOW_EXAMPLES.md](docs/WORKFLOW_EXAMPLES.md)

---

## 🔔 Notifications

### Supported Channels
- **Email** - Detailed notifications with links
- **In-App** - Real-time UI notifications
- **Slack** - Team collaboration and alerts
- **SMS** - Critical alerts only
- **Webhooks** - External system integration

### Notification Types
- Bug created/assigned/resolved
- Feature approved/completed
- Deployment success/failure
- Test failures
- Environment health issues
- System alerts

### Configure Preferences
```typescript
import NotificationService from './services/NotificationService';

const notificationService = new NotificationService();

await notificationService.updatePreferences({
  userId: "user123",
  channels: ["EMAIL", "IN_APP"],
  bugNotifications: true,
  featureNotifications: true,
  deploymentNotifications: true,
  systemAlerts: true,
  emailDigest: true,
  digestFrequency: "DAILY"
});
```

---

## 📊 Monitoring & Analytics

### Available Metrics
- Bug statistics (total, open, by severity, by category)
- Feature statistics (total, by status, by priority)
- Project statistics (active, completed, success rate)
- Deployment metrics (success rate, frequency)
- Test metrics (pass rate, coverage)
- Environment health (uptime, response time, resource usage)

### Generate Reports
```typescript
import DevQARepositoryCoordinator from './services/DevQARepositoryCoordinator';

const coordinator = new DevQARepositoryCoordinator();

const report = await coordinator.generateSystemReport();

console.log(`Open Bugs: ${report.bugs.open}`);
console.log(`Critical Bugs: ${report.bugs.critical}`);
console.log(`Features In Progress: ${report.features.inProgress}`);
console.log(`Active Projects: ${report.projects.active}`);
```

---

## 🔐 Security & Compliance

### Data Protection
- HIPAA-compliant bug reporting (automatic PII/PHI sanitization)
- Encrypted deployment credentials
- Secure code change tracking
- Complete audit trail

### Access Control
- Role-based permissions
- Environment-specific access
- Code review requirements
- Deployment approvals

### Compliance
- Audit logging for all actions
- Change tracking
- Deployment history
- Test verification records

---

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test
```

### Test Coverage
```bash
npm run test:coverage
```

---

## 🚀 Deployment

### Environment Setup
1. Configure environment variables
2. Run database migrations
3. Build application
4. Deploy to target environment
5. Run post-deployment tests

### Deployment Commands
```bash
# Build for production
npm run build

# Run migrations
npx prisma migrate deploy

# Start production server
npm run start
```

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement changes
3. Write tests
4. Submit pull request
5. Code review
6. Merge to main

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing
- Comprehensive documentation

---

## 📝 License

Copyright © 2025 NinjaTech AI - HoloVitals

---

## 🆘 Support

### Getting Help
- Review documentation in `/docs`
- Check workflow examples
- Review API documentation
- Contact development team

### Reporting Issues
Use the Bug Repository to report issues:
```typescript
await bugService.reportBug({
  title: "Issue title",
  description: "Detailed description",
  source: "USER_REPORT",
  severity: "MEDIUM",
  category: "OTHER"
});
```

---

## 🎉 Acknowledgments

Built with:
- Next.js 14+
- TypeScript
- Prisma ORM
- PostgreSQL
- Node.js

---

## 📈 Roadmap

### Current Version: 1.0.0
- ✅ Bug Repository
- ✅ Enhancement Repository
- ✅ Dev & QA Processing Repository
- ✅ Repository Coordinator
- ✅ Notification Service

### Planned Features
- 🔄 AI-powered bug detection
- 🔄 Intelligent roadmap planning
- 🔄 Advanced testing automation
- 🔄 Continuous deployment
- 🔄 Enhanced analytics dashboards

---

**Built with ❤️ by the HoloVitals Team**