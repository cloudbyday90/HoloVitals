/**
 * Simple InstanceProvisionerService Test
 * Basic validation tests
 */

import InstanceProvisionerService, {
  CloudProvider,
  InstanceType,
  InstanceStatus,
  ProvisionRequest
} from '@/lib/services/InstanceProvisionerService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_ID = 'test-user-simple';
const TEST_TASK_ID = 'test-task-simple';

describe('InstanceProvisionerService - Simple Tests', () => {
  let service: InstanceProvisionerService;

  beforeAll(async () => {
    service = InstanceProvisionerService.getInstance();
    
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        email: 'simple-test@example.com',
        passwordHash: 'test-hash'
      }
    });

    await prisma.analysisTask.upsert({
      where: { id: TEST_TASK_ID },
      update: {},
      create: {
        id: TEST_TASK_ID,
        userId: TEST_USER_ID,
        type: 'DOCUMENT_ANALYSIS',
        priority: 'HIGH',
        status: 'PENDING',
        data: JSON.stringify({ test: true })
      }
    });
  });

  afterAll(async () => {
    await prisma.cloudInstance.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.analysisTask.deleteMany({ where: { id: TEST_TASK_ID } });
    await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
    service.stopMonitoring();
  });

  it('should create service instance', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(InstanceProvisionerService);
  });

  it('should provision Azure instance', async () => {
    const request: ProvisionRequest = {
      userId: TEST_USER_ID,
      taskId: TEST_TASK_ID,
      config: {
        provider: CloudProvider.AZURE,
        instanceType: InstanceType.AZURE_NC6,
        region: 'eastus',
        diskSizeGB: 100,
        autoTerminateMinutes: 60
      },
      purpose: 'Simple Test'
    };

    const instance = await service.provisionInstance(request);

    expect(instance).toBeDefined();
    expect(instance.id).toBeDefined();
    expect(instance.provider).toBe(CloudProvider.AZURE);
    expect(instance.status).toBe(InstanceStatus.READY);
  }, 30000);

  it('should get instance statistics', async () => {
    const stats = await service.getStatistics(TEST_USER_ID);
    
    expect(stats).toBeDefined();
    expect(stats.totalProvisioned).toBeGreaterThanOrEqual(0);
    expect(stats.currentlyRunning).toBeGreaterThanOrEqual(0);
  });
});