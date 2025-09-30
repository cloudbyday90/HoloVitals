# Development & QA Repository System API Documentation

## Overview

This document provides comprehensive API documentation for the Development & QA Repository System, including Bug Repository, Development & Enhancement Repository, and Development & QA Processing Repository.

---

## Bug Repository API

### Report Bug

**Endpoint:** `POST /api/bugs`

**Description:** Report a new bug in the system.

**Request Body:**
```json
{
  "title": "Login page crashes on mobile",
  "description": "The login page crashes when accessed from mobile devices",
  "source": "USER_REPORT",
  "severity": "HIGH",
  "category": "UI_UX",
  "reportedBy": "user123",
  "reportedByEmail": "user@example.com",
  "stackTrace": "Error: Cannot read property...",
  "errorMessage": "TypeError: Cannot read property 'value' of null",
  "affectedComponent": "authentication",
  "environment": "PRODUCTION",
  "stepsToReproduce": "1. Open mobile browser\n2. Navigate to login page\n3. Enter credentials",
  "expectedBehavior": "Login page should load properly",
  "actualBehavior": "Page crashes with error",
  "attachments": ["https://example.com/screenshot.png"]
}
```

**Response:**
```json
{
  "success": true,
  "bug": {
    "id": "bug_123",
    "title": "Login page crashes on mobile",
    "status": "NEW",
    "severity": "HIGH",
    "priority": 75,
    "impactScore": 82.5,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Get Bug Details

**Endpoint:** `GET /api/bugs/:bugId`

**Description:** Get detailed information about a specific bug.

**Response:**
```json
{
  "id": "bug_123",
  "title": "Login page crashes on mobile",
  "description": "The login page crashes when accessed from mobile devices",
  "status": "TRIAGED",
  "severity": "HIGH",
  "category": "UI_UX",
  "priority": 75,
  "assignedTo": "dev_456",
  "reportedAt": "2025-01-15T10:30:00Z",
  "comments": [...],
  "history": [...]
}
```

### Update Bug Status

**Endpoint:** `PATCH /api/bugs/:bugId/status`

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "userId": "dev_456"
}
```

**Response:**
```json
{
  "success": true,
  "bug": {
    "id": "bug_123",
    "status": "IN_PROGRESS",
    "updatedAt": "2025-01-15T11:00:00Z"
  }
}
```

### Get Bug Statistics

**Endpoint:** `GET /api/bugs/statistics`

**Response:**
```json
{
  "total": 150,
  "open": 45,
  "critical": 5,
  "bySeverity": {
    "CRITICAL": 5,
    "HIGH": 15,
    "MEDIUM": 50,
    "LOW": 60,
    "TRIVIAL": 20
  },
  "byCategory": {
    "AUTHENTICATION": 10,
    "UI_UX": 25,
    "PERFORMANCE": 15,
    ...
  },
  "averageResolutionTime": 48
}
```

### Add Bug Comment

**Endpoint:** `POST /api/bugs/:bugId/comments`

**Request Body:**
```json
{
  "authorId": "dev_456",
  "authorName": "John Developer",
  "content": "I've identified the root cause...",
  "isInternal": false
}
```

---

## Development & Enhancement Repository API

### Submit Feature Request

**Endpoint:** `POST /api/features`

**Request Body:**
```json
{
  "title": "Add dark mode support",
  "description": "Implement dark mode across the entire application",
  "type": "NEW_FEATURE",
  "priority": "MEDIUM",
  "requestedBy": "user123",
  "requestedByEmail": "user@example.com",
  "businessValue": "Improves user experience and reduces eye strain",
  "targetAudience": "All users",
  "expectedImpact": "Increased user satisfaction and engagement",
  "successMetrics": "User adoption rate, positive feedback",
  "estimatedEffort": 80,
  "complexity": 6,
  "tags": ["ui", "accessibility"]
}
```

**Response:**
```json
{
  "success": true,
  "feature": {
    "id": "feature_789",
    "title": "Add dark mode support",
    "status": "PROPOSED",
    "priority": "MEDIUM",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Evaluate Feature

**Endpoint:** `POST /api/features/:featureId/evaluate`

**Request Body:**
```json
{
  "approved": true,
  "priority": "HIGH",
  "targetRelease": "v2.0",
  "targetDate": "2025-03-01T00:00:00Z",
  "feedback": "Approved for next release",
  "evaluatedBy": "product_manager_1"
}
```

### Get Impact Analysis

**Endpoint:** `GET /api/features/:featureId/impact`

**Response:**
```json
{
  "featureId": "feature_789",
  "technicalImpact": {
    "complexity": 6,
    "effort": 80,
    "risk": "MEDIUM",
    "dependencies": []
  },
  "businessImpact": {
    "value": 75,
    "audience": "All users",
    "expectedOutcome": "Increased user satisfaction"
  },
  "resourceImpact": {
    "developmentTime": 80,
    "testingTime": 24,
    "documentationTime": 8
  },
  "overallScore": 72
}
```

### Create Roadmap

**Endpoint:** `POST /api/roadmaps`

**Request Body:**
```json
{
  "name": "Q1 2025 Roadmap",
  "description": "Features planned for Q1 2025",
  "version": "v2.0",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-03-31T23:59:59Z",
  "features": ["feature_789", "feature_790"],
  "goals": ["Improve UX", "Increase performance"]
}
```

### Vote on Feature

**Endpoint:** `POST /api/features/:featureId/vote`

**Request Body:**
```json
{
  "userId": "user123",
  "vote": 1,
  "comment": "This would be very useful!"
}
```

---

## Development & QA Processing Repository API

### Create Development Project

**Endpoint:** `POST /api/projects`

**Request Body:**
```json
{
  "name": "Fix login page crash",
  "description": "Fix the mobile login page crash issue",
  "type": "BUG_FIX",
  "sourceType": "BUG",
  "sourceId": "bug_123",
  "assignedTo": "dev_456",
  "assignedTeam": "frontend-team",
  "tags": ["bug-fix", "ui-ux", "high-priority"]
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "project_001",
    "name": "Fix login page crash",
    "status": "PLANNING",
    "createdAt": "2025-01-15T10:30:00Z",
    "environments": [
      {
        "environment": "DEVELOPMENT",
        "branch": "dev",
        "isActive": true
      },
      {
        "environment": "QA",
        "branch": "qa",
        "isActive": true
      }
    ]
  }
}
```

### Deploy to Environment

**Endpoint:** `POST /api/projects/:projectId/deploy`

**Request Body:**
```json
{
  "environment": "QA",
  "version": "1.0.0",
  "branch": "qa",
  "commitHash": "abc123def456",
  "deployedBy": "dev_456",
  "notes": "Deploying bug fix to QA"
}
```

**Response:**
```json
{
  "success": true,
  "deploymentId": "deploy_001",
  "status": "SUCCESS",
  "completedAt": "2025-01-15T11:00:00Z"
}
```

### Run Tests

**Endpoint:** `POST /api/projects/:projectId/tests`

**Request Body:**
```json
{
  "environment": "QA",
  "testSuite": "full",
  "testType": "INTEGRATION",
  "triggeredBy": "dev_456"
}
```

**Response:**
```json
{
  "success": true,
  "testRunId": "test_001",
  "results": {
    "total": 100,
    "passed": 95,
    "failed": 5,
    "skipped": 0,
    "duration": 30,
    "coverage": 85.5
  }
}
```

### Rollback Deployment

**Endpoint:** `POST /api/deployments/:deploymentId/rollback`

**Request Body:**
```json
{
  "rolledBackBy": "dev_456"
}
```

### Get Project Status

**Endpoint:** `GET /api/projects/:projectId/status`

**Response:**
```json
{
  "project": {
    "id": "project_001",
    "name": "Fix login page crash",
    "status": "TESTING"
  },
  "environments": [...],
  "deployments": [...],
  "testRuns": [...],
  "codeChanges": [...],
  "summary": {
    "totalDeployments": 5,
    "successfulDeployments": 4,
    "totalTests": 500,
    "passedTests": 475,
    "totalCodeChanges": 15,
    "reviewedChanges": 12
  }
}
```

### Track Code Change

**Endpoint:** `POST /api/projects/:projectId/code-changes`

**Request Body:**
```json
{
  "type": "MODIFY",
  "filePath": "src/components/Login.tsx",
  "commitHash": "abc123",
  "commitMessage": "Fix mobile login crash",
  "branch": "dev",
  "author": "dev_456",
  "linesAdded": 15,
  "linesRemoved": 8,
  "complexity": 3
}
```

---

## Repository Coordinator API

### Process Bug Report (Full Workflow)

**Endpoint:** `POST /api/coordinator/process-bug`

**Request Body:**
```json
{
  "title": "Login page crashes on mobile",
  "description": "The login page crashes when accessed from mobile devices",
  "source": "USER_REPORT",
  "severity": "CRITICAL",
  "category": "UI_UX"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bug processed and development project created",
  "data": {
    "bug": {...},
    "enhancement": {...},
    "project": {...}
  }
}
```

### Process Feature Request (Full Workflow)

**Endpoint:** `POST /api/coordinator/process-feature`

**Request Body:**
```json
{
  "title": "Add dark mode support",
  "description": "Implement dark mode across the entire application",
  "type": "NEW_FEATURE",
  "priority": "MEDIUM"
}
```

### Complete and Deploy

**Endpoint:** `POST /api/coordinator/complete-deploy/:projectId`

**Request Body:**
```json
{
  "deployedBy": "dev_456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project completed and deployed successfully",
  "data": {
    "testResult": {...},
    "stagingDeployment": {...},
    "stagingTestResult": {...}
  }
}
```

### Get System Report

**Endpoint:** `GET /api/coordinator/system-report`

**Response:**
```json
{
  "timestamp": "2025-01-15T12:00:00Z",
  "bugs": {
    "total": 150,
    "open": 45,
    "critical": 5
  },
  "features": {
    "total": 75,
    "inProgress": 12,
    "completed": 50
  },
  "projects": {
    "total": 30,
    "active": 8,
    "completed": 20
  },
  "summary": {
    "openBugs": 45,
    "criticalBugs": 5,
    "featuresInProgress": 12,
    "activeProjects": 8
  }
}
```

### Get High Priority Items

**Endpoint:** `GET /api/coordinator/high-priority`

**Response:**
```json
{
  "criticalBugs": [...],
  "highPriorityBugs": [...],
  "criticalFeatures": [...]
}
```

---

## Notification API

### Send Notification

**Endpoint:** `POST /api/notifications`

**Request Body:**
```json
{
  "type": "BUG_CRITICAL",
  "priority": "URGENT",
  "recipientId": "dev_456",
  "recipientEmail": "dev@example.com",
  "title": "CRITICAL BUG: Login page crashes",
  "message": "A critical bug has been reported...",
  "channels": ["EMAIL", "SLACK", "IN_APP"],
  "actionUrl": "/bugs/bug_123"
}
```

### Get User Notifications

**Endpoint:** `GET /api/notifications/user/:userId`

**Query Parameters:**
- `unreadOnly`: boolean (optional)

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_001",
      "type": "BUG_ASSIGNED",
      "title": "New Bug Assigned",
      "message": "A HIGH bug has been assigned to you",
      "read": false,
      "createdAt": "2025-01-15T10:30:00Z",
      "actionUrl": "/bugs/bug_123"
    }
  ]
}
```

### Update Notification Preferences

**Endpoint:** `PUT /api/notifications/preferences`

**Request Body:**
```json
{
  "userId": "dev_456",
  "channels": ["EMAIL", "IN_APP"],
  "bugNotifications": true,
  "featureNotifications": true,
  "deploymentNotifications": true,
  "systemAlerts": true,
  "emailDigest": true,
  "digestFrequency": "DAILY"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": "Missing required field: title"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **Standard endpoints:** 100 requests per minute per user
- **Bulk operations:** 10 requests per minute per user
- **System monitoring:** 1000 requests per minute (internal only)

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

---

## Authentication

All API endpoints require authentication using JWT tokens:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained through the authentication service and are valid for 15 minutes. Refresh tokens can be used to obtain new access tokens.

---

## Webhooks

The system supports webhooks for real-time notifications:

### Configure Webhook

**Endpoint:** `POST /api/webhooks`

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["BUG_CREATED", "DEPLOYMENT_SUCCESS", "TEST_FAILED"],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload Example

```json
{
  "event": "BUG_CREATED",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "bugId": "bug_123",
    "title": "Login page crashes",
    "severity": "CRITICAL"
  },
  "signature": "sha256=..."
}
```

---

## Best Practices

1. **Always check response status codes** before processing data
2. **Implement retry logic** for failed requests with exponential backoff
3. **Use pagination** for list endpoints to avoid large responses
4. **Cache responses** where appropriate to reduce API calls
5. **Validate input data** before sending requests
6. **Handle rate limits** gracefully with proper error handling
7. **Use webhooks** for real-time updates instead of polling
8. **Secure webhook endpoints** by validating signatures
9. **Monitor API usage** to stay within rate limits
10. **Keep authentication tokens secure** and refresh them regularly