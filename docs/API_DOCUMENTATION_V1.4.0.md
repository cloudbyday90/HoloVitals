# HoloVitals RBAC System - API Documentation v1.4.0

## Overview
This document provides comprehensive documentation for all RBAC (Role-Based Access Control) API endpoints in HoloVitals v1.4.0.

## Authentication
All API endpoints require authentication via NextAuth session. Include session cookies in all requests.

## Authorization
Endpoints are protected by RBAC middleware. Required permissions are listed for each endpoint.

---

## Employee Management APIs

### List Employees
**Endpoint:** `GET /api/staff/employees`  
**Permission Required:** `employee:read`

**Query Parameters:**
- `search` (optional): Search by name, email, or employee ID
- `departmentId` (optional): Filter by department
- `status` (optional): Filter by status (ACTIVE, INACTIVE, ON_LEAVE, TERMINATED)
- `employmentType` (optional): Filter by employment type (FULL_TIME, PART_TIME, CONTRACT, INTERN)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Results per page

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeId": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "jobTitle": "Software Engineer",
    "status": "ACTIVE",
    "employmentType": "FULL_TIME",
    "startDate": "2024-01-01T00:00:00.000Z",
    "department": {
      "id": "uuid",
      "name": "Engineering"
    },
    "role": {
      "id": "uuid",
      "name": "DEVELOPER"
    }
  }
]
```

### Get Employee Details
**Endpoint:** `GET /api/staff/employees/{id}`  
**Permission Required:** `employee:read` (or own profile)

**Response:**
```json
{
  "id": "uuid",
  "employeeId": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "jobTitle": "Software Engineer",
  "status": "ACTIVE",
  "employmentType": "FULL_TIME",
  "startDate": "2024-01-01T00:00:00.000Z",
  "salary": 100000,
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1234567891"
  },
  "department": {
    "id": "uuid",
    "name": "Engineering"
  },
  "role": {
    "id": "uuid",
    "name": "DEVELOPER",
    "permissions": [
      {
        "id": "uuid",
        "name": "patient:read",
        "description": "View patient information"
      }
    ]
  }
}
```

### Create Employee
**Endpoint:** `POST /api/staff/employees`  
**Permission Required:** `employee:create`

**Request Body:**
```json
{
  "userId": "uuid",
  "employeeId": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "departmentId": "uuid",
  "roleId": "uuid",
  "employmentType": "FULL_TIME",
  "startDate": "2024-01-01",
  "jobTitle": "Software Engineer",
  "salary": 100000,
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1234567891"
  }
}
```

**Response:** Employee object (same as Get Employee Details)

### Update Employee
**Endpoint:** `PUT /api/staff/employees/{id}`  
**Permission Required:** `employee:update`

**Request Body:** Same as Create Employee (all fields optional)

**Response:** Updated employee object

### Delete Employee (Soft Delete)
**Endpoint:** `DELETE /api/staff/employees/{id}`  
**Permission Required:** `employee:delete`

**Response:**
```json
{
  "success": true
}
```

### Terminate Employee
**Endpoint:** `POST /api/staff/employees/{id}/terminate`  
**Permission Required:** `employee:terminate`

**Request Body:**
```json
{
  "terminationDate": "2024-12-31",
  "reason": "Resignation"
}
```

**Response:** Updated employee object with TERMINATED status

### Reactivate Employee
**Endpoint:** `POST /api/staff/employees/{id}/reactivate`  
**Permission Required:** `employee:update`

**Response:** Updated employee object with ACTIVE status

---

## Role Management APIs

### List Roles
**Endpoint:** `GET /api/staff/roles`  
**Permission Required:** `role:read`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "SUPER_ADMIN",
    "description": "Full system access",
    "level": 100,
    "parentRoleId": null,
    "permissions": [
      {
        "id": "uuid",
        "name": "system:admin",
        "description": "Full system administration"
      }
    ],
    "_count": {
      "employees": 5
    }
  }
]
```

### Get Role Details
**Endpoint:** `GET /api/staff/roles/{id}`  
**Permission Required:** `role:read`

**Response:** Role object with full details

### Create Role
**Endpoint:** `POST /api/staff/roles`  
**Permission Required:** `role:create`

**Request Body:**
```json
{
  "name": "CUSTOM_ROLE",
  "description": "Custom role description",
  "level": 50,
  "parentRoleId": "uuid"
}
```

**Response:** Created role object

### Update Role
**Endpoint:** `PUT /api/staff/roles/{id}`  
**Permission Required:** `role:update`

**Request Body:** Same as Create Role (all fields optional)

**Response:** Updated role object

### Delete Role
**Endpoint:** `DELETE /api/staff/roles/{id}`  
**Permission Required:** `role:delete`

**Response:**
```json
{
  "success": true
}
```

### Assign Permissions to Role
**Endpoint:** `POST /api/staff/roles/{id}/permissions`  
**Permission Required:** `role:update`

**Request Body:**
```json
{
  "permissionIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:** Updated role object with new permissions

---

## Department Management APIs

### List Departments
**Endpoint:** `GET /api/staff/departments`  
**Permission Required:** `department:read`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Engineering",
    "description": "Software development team",
    "budget": 5000000,
    "costCenter": "ENG-001",
    "manager": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "_count": {
      "employees": 25
    }
  }
]
```

### Get Department Details
**Endpoint:** `GET /api/staff/departments/{id}`  
**Permission Required:** `department:read`

**Response:** Department object with full details

### Create Department
**Endpoint:** `POST /api/staff/departments`  
**Permission Required:** `department:create`

**Request Body:**
```json
{
  "name": "Engineering",
  "description": "Software development team",
  "managerId": "uuid",
  "budget": 5000000,
  "costCenter": "ENG-001"
}
```

**Response:** Created department object

### Update Department
**Endpoint:** `PUT /api/staff/departments/{id}`  
**Permission Required:** `department:update`

**Request Body:** Same as Create Department (all fields optional)

**Response:** Updated department object

### Delete Department
**Endpoint:** `DELETE /api/staff/departments/{id}`  
**Permission Required:** `department:delete`

**Response:**
```json
{
  "success": true
}
```

---

## Onboarding Management APIs

### List Onboarding Records
**Endpoint:** `GET /api/staff/onboarding`  
**Permission Required:** `onboarding:read`

**Query Parameters:**
- `stage` (optional): Filter by onboarding stage
- `departmentId` (optional): Filter by department

**Response:**
```json
[
  {
    "id": "uuid",
    "currentStage": "TRAINING_STARTED",
    "invitationToken": "token",
    "invitationSentAt": "2024-01-01T00:00:00.000Z",
    "completedAt": null,
    "employee": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "department": {
        "name": "Engineering"
      }
    }
  }
]
```

### Get Onboarding Details
**Endpoint:** `GET /api/staff/onboarding/{id}`  
**Permission Required:** `onboarding:read` (or own onboarding)

**Response:** Onboarding object with full details including checklist and documents

### Send Invitation
**Endpoint:** `POST /api/staff/onboarding/invite`  
**Permission Required:** `onboarding:create`

**Request Body:**
```json
{
  "employeeId": "uuid",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** Created onboarding record with invitation token

### Advance Onboarding Stage
**Endpoint:** `POST /api/staff/onboarding/{id}/advance`  
**Permission Required:** `onboarding:update` (or own onboarding)

**Response:** Updated onboarding record with next stage

### Complete Onboarding
**Endpoint:** `POST /api/staff/onboarding/{id}/complete`  
**Permission Required:** `onboarding:update`

**Response:** Completed onboarding record with ACTIVE stage

### Upload Document
**Endpoint:** `POST /api/staff/onboarding/{id}/documents`  
**Permission Required:** `onboarding:update` (or own onboarding)

**Request Body:**
```json
{
  "documentName": "ID Proof",
  "documentUrl": "https://example.com/documents/id.pdf",
  "documentType": "identification"
}
```

**Response:** Updated onboarding record

### Update Checklist Item
**Endpoint:** `POST /api/staff/onboarding/{id}/checklist`  
**Permission Required:** `onboarding:update` (or own onboarding)

**Request Body:**
```json
{
  "itemId": "item-1",
  "completed": true
}
```

**Response:** Updated onboarding record

---

## Audit Log APIs

### List Audit Logs
**Endpoint:** `GET /api/staff/audit`  
**Permission Required:** `audit:read`

**Query Parameters:**
- `employeeId` (optional): Filter by employee
- `action` (optional): Filter by action
- `resourceType` (optional): Filter by resource type
- `resourceId` (optional): Filter by resource ID
- `success` (optional): Filter by success status (true/false)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Results per page

**Response:**
```json
[
  {
    "id": "uuid",
    "action": "employee:create",
    "resourceType": "employee",
    "resourceId": "uuid",
    "success": true,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "employee": {
      "id": "uuid",
      "firstName": "Admin",
      "lastName": "User"
    },
    "details": {
      "employeeId": "EMP001",
      "name": "John Doe"
    }
  }
]
```

### Get Audit Log Details
**Endpoint:** `GET /api/staff/audit/{id}`  
**Permission Required:** `audit:read`

**Response:** Audit log object with full details

### Export Audit Logs
**Endpoint:** `GET /api/staff/audit/export`  
**Permission Required:** `audit:export`

**Query Parameters:**
- `format` (required): Export format (csv or json)
- All filter parameters from List Audit Logs

**Response:** File download (CSV or JSON)

### Generate Compliance Report
**Endpoint:** `GET /api/staff/audit/compliance-report`  
**Permission Required:** `audit:read`

**Query Parameters:**
- `startDate` (optional): Report start date
- `endDate` (optional): Report end date

**Response:**
```json
{
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z"
  },
  "summary": {
    "totalActions": 1000,
    "successfulActions": 950,
    "failedActions": 50,
    "uniqueEmployees": 25
  },
  "actionBreakdown": [
    {
      "action": "employee:create",
      "count": 100
    }
  ],
  "suspiciousActivity": [
    {
      "employeeId": "uuid",
      "failedAttempts": 10,
      "actions": ["login:failed"]
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting
Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## Pagination
Endpoints that support pagination return results in the following format:
- Results are returned as an array
- Use `page` and `limit` query parameters to control pagination
- Default page size is 20-50 depending on the endpoint

## Best Practices
1. Always check for required permissions before making requests
2. Use appropriate HTTP methods (GET for reading, POST for creating, PUT for updating, DELETE for deleting)
3. Include proper error handling in your client code
4. Log all API interactions for debugging and audit purposes
5. Use the audit log APIs to track all system changes

---

**Version:** 1.4.0  
**Last Updated:** 2024-01-04