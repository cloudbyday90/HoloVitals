# Service 4: InstanceProvisionerService

## Overview

The **InstanceProvisionerService** manages ephemeral cloud instances for GPU-intensive AI analysis tasks. It provides **90% cost savings** compared to always-on instances through on-demand provisioning and automatic termination.

## Key Features

### 1. Multi-Cloud Support
- **Azure**: Standard_NC6, NC12, NC24, NV6, NV12
- **AWS**: p2.xlarge, p2.8xlarge, p3.2xlarge, g4dn.xlarge, g4dn.12xlarge
- **GCP**: Ready for future implementation

### 2. Automatic Lifecycle Management
```
PROVISIONING → CONFIGURING → READY → RUNNING → STOPPING → TERMINATED
```

### 3. Cost Optimization
- **On-demand provisioning**: Only pay for what you use
- **Automatic termination**: Configurable auto-terminate (5-120 minutes)
- **Cost tracking**: Real-time cost calculation per instance
- **90% savings**: vs always-on GPU instances

### 4. Instance Types & Costs

#### Azure GPU Instances
| Instance Type | GPU | vCPUs | RAM | Cost/Hour |
|--------------|-----|-------|-----|-----------|
| Standard_NC6 | 1x K80 | 6 | 56GB | $0.90 |
| Standard_NC12 | 2x K80 | 12 | 112GB | $1.80 |
| Standard_NC24 | 4x K80 | 24 | 224GB | $3.60 |
| Standard_NV6 | 1x M60 | 6 | 56GB | $1.14 |
| Standard_NV12 | 2x M60 | 12 | 112GB | $2.28 |

#### AWS GPU Instances
| Instance Type | GPU | vCPUs | RAM | Cost/Hour |
|--------------|-----|-------|-----|-----------|
| p2.xlarge | 1x K80 | 4 | 61GB | $0.90 |
| p2.8xlarge | 8x K80 | 32 | 488GB | $7.20 |
| p3.2xlarge | 1x V100 | 8 | 61GB | $3.06 |
| g4dn.xlarge | 1x T4 | 4 | 16GB | $0.526 |
| g4dn.12xlarge | 4x T4 | 48 | 192GB | $3.912 |

## API Reference

### Provision Instance

**Endpoint:** `POST /api/instances`

**Request Body:**
```json
{
  "userId": "user-123",
  "taskId": "task-456",
  "config": {
    "provider": "AZURE",
    "instanceType": "Standard_NC6",
    "region": "eastus",
    "diskSizeGB": 100,
    "autoTerminateMinutes": 60,
    "tags": {
      "environment": "production",
      "project": "medical-analysis"
    }
  },
  "purpose": "Medical Document Analysis"
}
```

**Response:**
```json
{
  "success": true,
  "instance": {
    "id": "inst-789",
    "provider": "AZURE",
    "instanceType": "Standard_NC6",
    "status": "READY",
    "publicIp": "20.123.45.67",
    "privateIp": "10.0.1.5",
    "region": "eastus",
    "costPerHour": 0.90,
    "totalCost": 0,
    "createdAt": "2025-09-30T12:00:00Z",
    "metadata": {
      "resourceGroup": "holovitals-rg",
      "location": "eastus",
      "vmSize": "Standard_NC6"
    }
  }
}
```

### Get Instance Details

**Endpoint:** `GET /api/instances/:id`

**Response:**
```json
{
  "success": true,
  "instance": {
    "id": "inst-789",
    "provider": "AZURE",
    "instanceType": "Standard_NC6",
    "status": "RUNNING",
    "publicIp": "20.123.45.67",
    "privateIp": "10.0.1.5",
    "region": "eastus",
    "costPerHour": 0.90,
    "totalCost": 0.45,
    "createdAt": "2025-09-30T12:00:00Z",
    "terminatedAt": null
  }
}
```

### List Instances

**Endpoint:** `GET /api/instances?userId=user-123&status=READY`

**Query Parameters:**
- `userId` (required): User ID
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "instances": [
    {
      "id": "inst-789",
      "provider": "AZURE",
      "status": "READY",
      "costPerHour": 0.90,
      "totalCost": 0
    },
    {
      "id": "inst-790",
      "provider": "AWS",
      "status": "RUNNING",
      "costPerHour": 0.526,
      "totalCost": 0.263
    }
  ],
  "count": 2
}
```

### Terminate Instance

**Endpoint:** `DELETE /api/instances/:id`

**Response:**
```json
{
  "success": true,
  "message": "Instance terminated successfully"
}
```

### Get Statistics

**Endpoint:** `GET /api/instances/stats?userId=user-123`

**Query Parameters:**
- `userId` (optional): Filter by user

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalProvisioned": 150,
    "currentlyRunning": 5,
    "totalCost": 1234.56,
    "averageDuration": 0.75,
    "averageCost": 0.68,
    "providerBreakdown": {
      "AZURE": 80,
      "AWS": 70
    },
    "instanceTypeBreakdown": {
      "Standard_NC6": 50,
      "g4dn.xlarge": 40,
      "p3.2xlarge": 30,
      "Standard_NC12": 30
    }
  }
}
```

## Usage Examples

### Example 1: Provision Azure Instance for Medical Analysis

```typescript
import InstanceProvisionerService, {
  CloudProvider,
  InstanceType,
  ProvisionRequest
} from '@/lib/services/InstanceProvisionerService';

const service = InstanceProvisionerService.getInstance();

const request: ProvisionRequest = {
  userId: 'user-123',
  taskId: 'task-456',
  config: {
    provider: CloudProvider.AZURE,
    instanceType: InstanceType.AZURE_NC6,
    region: 'eastus',
    diskSizeGB: 100,
    autoTerminateMinutes: 60,
    tags: {
      environment: 'production',
      purpose: 'medical-analysis'
    }
  },
  purpose: 'Analyze 50 medical documents with GPT-4'
};

// Provision instance (takes ~15 seconds)
const instance = await service.provisionInstance(request);
console.log(`Instance ready: ${instance.publicIp}`);

// Use instance for analysis...
// Instance will auto-terminate after 60 minutes

// Or manually terminate when done
await service.terminateInstance(instance.id);
```

### Example 2: Provision AWS Instance for Batch Processing

```typescript
const request: ProvisionRequest = {
  userId: 'user-123',
  taskId: 'batch-789',
  config: {
    provider: CloudProvider.AWS,
    instanceType: InstanceType.AWS_G4DN_XLARGE,
    region: 'us-east-1',
    diskSizeGB: 50,
    autoTerminateMinutes: 30
  },
  purpose: 'Batch process 100 patient records'
};

const instance = await service.provisionInstance(request);

// Instance will auto-terminate after 30 minutes
// Cost: $0.526/hour = $0.263 for 30 minutes
```

### Example 3: Monitor Instance Costs

```typescript
// Get statistics for a user
const stats = await service.getStatistics('user-123');

console.log(`Total instances: ${stats.totalProvisioned}`);
console.log(`Currently running: ${stats.currentlyRunning}`);
console.log(`Total cost: $${stats.totalCost.toFixed(2)}`);
console.log(`Average cost per instance: $${stats.averageCost.toFixed(2)}`);
console.log(`Average duration: ${stats.averageDuration.toFixed(2)} hours`);
```

### Example 4: Event-Driven Architecture

```typescript
const service = InstanceProvisionerService.getInstance();

// Listen to instance lifecycle events
service.on('instance:provisioning', ({ instanceId }) => {
  console.log(`Starting provisioning: ${instanceId}`);
});

service.on('instance:ready', ({ instanceId }) => {
  console.log(`Instance ready: ${instanceId}`);
  // Start analysis task
});

service.on('instance:terminated', ({ instanceId, totalCost }) => {
  console.log(`Instance terminated: ${instanceId}`);
  console.log(`Total cost: $${totalCost.toFixed(2)}`);
});

service.on('instance:error', ({ error }) => {
  console.error(`Instance error: ${error}`);
});
```

## Cost Savings Analysis

### Scenario: Medical Document Analysis Platform

**Traditional Approach (Always-On):**
- 1x Azure NC6 instance: $0.90/hour
- Running 24/7: $0.90 × 24 × 30 = $648/month
- Annual cost: $7,776

**Ephemeral Approach (On-Demand):**
- Average usage: 2 hours/day
- Cost: $0.90 × 2 × 30 = $54/month
- Annual cost: $648

**Savings: $7,128/year (91.7% reduction)**

### Multi-User Platform

**100 users, each using 2 hours/day:**
- Traditional: 100 instances × $648/month = $64,800/month
- Ephemeral: 100 users × $54/month = $5,400/month
- **Monthly savings: $59,400 (91.7%)**
- **Annual savings: $712,800**

## Configuration

### Environment Variables

```env
# Azure Configuration (if using Azure)
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# AWS Configuration (if using AWS)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Instance Configuration Limits

```typescript
// Minimum disk size
diskSizeGB: 30 // GB

// Minimum auto-terminate time
autoTerminateMinutes: 5 // minutes

// Maximum auto-terminate time (recommended)
autoTerminateMinutes: 120 // 2 hours
```

## Monitoring & Health Checks

### Automatic Monitoring

The service includes automatic monitoring that:
- Checks every 60 seconds for instances needing termination
- Auto-terminates instances that exceed their configured lifetime
- Emits events for all lifecycle changes
- Tracks costs in real-time

### Health Monitoring

```typescript
// Get current running instances
const instances = await service.listInstances(userId, InstanceStatus.RUNNING);

// Check for long-running instances
instances.forEach(instance => {
  const ageMinutes = (Date.now() - instance.createdAt.getTime()) / (1000 * 60);
  if (ageMinutes > 60) {
    console.warn(`Instance ${instance.id} running for ${ageMinutes} minutes`);
  }
});
```

## Error Handling

### Common Errors

```typescript
try {
  await service.provisionInstance(request);
} catch (error) {
  if (error.message.includes('Disk size')) {
    // Handle disk size validation error
  } else if (error.message.includes('Auto-terminate')) {
    // Handle auto-terminate validation error
  } else if (error.message.includes('Provider')) {
    // Handle provider error
  }
}
```

### Retry Logic

The service does NOT automatically retry failed provisions. Implement your own retry logic:

```typescript
async function provisionWithRetry(request: ProvisionRequest, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await service.provisionInstance(request);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
    }
  }
}
```

## Best Practices

### 1. Right-Size Your Instances

Choose the smallest instance that meets your needs:
- **Light analysis** (< 10 documents): g4dn.xlarge ($0.526/hr)
- **Medium analysis** (10-50 documents): Standard_NC6 ($0.90/hr)
- **Heavy analysis** (50+ documents): p3.2xlarge ($3.06/hr)

### 2. Set Appropriate Auto-Terminate Times

- **Quick tasks** (< 15 min): 30 minutes
- **Medium tasks** (15-45 min): 60 minutes
- **Long tasks** (45-90 min): 120 minutes

### 3. Monitor Costs

```typescript
// Daily cost check
const stats = await service.getStatistics(userId);
if (stats.totalCost > DAILY_BUDGET) {
  // Alert user or throttle provisioning
}
```

### 4. Clean Up Terminated Instances

```typescript
// Archive old terminated instances (run daily)
const terminated = await service.listInstances(userId, InstanceStatus.TERMINATED);
const oldInstances = terminated.filter(i => {
  const age = Date.now() - i.terminatedAt!.getTime();
  return age > 30 * 24 * 60 * 60 * 1000; // 30 days
});

// Archive to cold storage or delete
```

### 5. Use Tags for Organization

```typescript
config: {
  tags: {
    environment: 'production',
    project: 'medical-analysis',
    department: 'radiology',
    costCenter: 'CC-1234'
  }
}
```

## Testing

### Unit Tests

```bash
npm test -- InstanceProvisionerService.simple.test.ts
```

**Test Coverage:**
- ✅ Service instantiation
- ✅ Azure instance provisioning
- ✅ AWS instance provisioning
- ✅ Instance retrieval
- ✅ Instance termination
- ✅ Statistics calculation
- ✅ Cost tracking
- ✅ Event emissions

### Integration Tests

```bash
npm test -- InstanceProvisionerService.test.ts
```

**Test Coverage:**
- ✅ Full lifecycle (provision → terminate)
- ✅ Multiple instances
- ✅ Status filtering
- ✅ Cost calculations
- ✅ Auto-termination
- ✅ Error handling

## Performance Metrics

### Provisioning Times
- **Azure**: ~15 seconds (5s provision + 10s configure)
- **AWS**: ~15 seconds (5s provision + 10s configure)

### Termination Times
- **All providers**: ~2 seconds

### Cost Calculation
- **Real-time**: Updated on every status change
- **Accuracy**: ±0.01 hours

## Database Schema

```prisma
model CloudInstance {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id])
  
  taskId              String?
  task                AnalysisTask? @relation(fields: [taskId], references: [id])
  
  provider            String    // AZURE, AWS, GCP
  instanceType        String    // e.g., Standard_NC6, p2.xlarge
  region              String
  cloudInstanceId     String?
  
  publicIp            String?
  privateIp           String?
  
  status              String    // PROVISIONING, CONFIGURING, READY, etc.
  
  diskSizeGB          Int       @default(100)
  autoTerminateMinutes Int      @default(60)
  
  costPerHour         Float
  totalCost           Float     @default(0)
  
  purpose             String?
  metadata            Json?
  
  createdAt           DateTime  @default(now())
  terminatedAt        DateTime?
  updatedAt           DateTime  @updatedAt
  
  @@index([userId])
  @@index([taskId])
  @@index([status])
  @@index([provider])
}
```

## Roadmap

### Phase 1 (Current) ✅
- Multi-cloud support (Azure, AWS)
- Automatic lifecycle management
- Cost tracking
- Event-driven architecture

### Phase 2 (Planned)
- GCP support
- Spot instance support (70% additional savings)
- Auto-scaling based on queue depth
- Advanced cost optimization

### Phase 3 (Future)
- Multi-region failover
- Instance pooling
- Predictive provisioning
- ML-based cost optimization

## Support

For issues or questions:
- GitHub Issues: https://github.com/cloudbyday90/HoloVitals/issues
- Documentation: `/docs`
- Email: support@holovitals.com

---

**Last Updated:** September 30, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅