/**
 * InstanceProvisionerService Test Suite
 * 
 * Tests for ephemeral cloud instance provisioning and management
 */

import InstanceProvisionerService, {
  CloudProvider,
  InstanceType,
  InstanceStatus,
  ProvisionRequest
} from '@/lib/services/InstanceProvisionerService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock user and task IDs
const TEST_USER_ID = 'test-user-instance-provisioner';
const TEST_TASK_ID = 'test-task-instance-provisioner';

describe('InstanceProvisionerService', () => {
  let service: InstanceProvisionerService;

  beforeAll(async () => {
    service = InstanceProvisionerService.getInstance();
    
    // Create test user
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        email: 'instance-test@example.com',
        passwordHash: 'test-hash'
      }
    });

    // Create test task
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
    // Clean up test data
    await prisma.cloudInstance.deleteMany({
      where: { userId: TEST_USER_ID }
    });
    await prisma.analysisTask.deleteMany({
      where: { id: TEST_TASK_ID }
    });
    await prisma.user.deleteMany({
      where: { id: TEST_USER_ID }
    });
    
    service.stopMonitoring();
    await prisma.$disconnect();
  });

  describe('provisionInstance', () => {
    it('should provision an Azure instance successfully', async () => {
      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC6,
          region: 'eastus',
          diskSizeGB: 100,
          autoTerminateMinutes: 60,
          tags: { environment: 'test' }
        },
        purpose: 'Test AI Analysis'
      };

      const instance = await service.provisionInstance(request);

      expect(instance).toBeDefined();
      expect(instance.id).toBeDefined();
      expect(instance.provider).toBe(CloudProvider.AZURE);
      expect(instance.instanceType).toBe(InstanceType.AZURE_NC6);
      expect(instance.status).toBe(InstanceStatus.READY);
      expect(instance.publicIp).toBeDefined();
      expect(instance.privateIp).toBeDefined();
      expect(instance.costPerHour).toBe(0.90);
      expect(instance.totalCost).toBe(0);
    }, 30000); // 30 second timeout for provisioning

    it('should provision an AWS instance successfully', async () => {
      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AWS,
          instanceType: InstanceType.AWS_G4DN_XLARGE,
          region: 'us-east-1',
          diskSizeGB: 50,
          autoTerminateMinutes: 30
        },
        purpose: 'Test GPU Processing'
      };

      const instance = await service.provisionInstance(request);

      expect(instance).toBeDefined();
      expect(instance.provider).toBe(CloudProvider.AWS);
      expect(instance.instanceType).toBe(InstanceType.AWS_G4DN_XLARGE);
      expect(instance.status).toBe(InstanceStatus.READY);
      expect(instance.costPerHour).toBe(0.526);
    }, 30000);

    it('should reject invalid configuration', async () => {
      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC6,
          region: 'eastus',
          diskSizeGB: 10, // Too small
          autoTerminateMinutes: 60
        },
        purpose: 'Test'
      };

      await expect(service.provisionInstance(request)).rejects.toThrow(
        'Disk size must be at least 30GB'
      );
    });

    it('should reject auto-terminate time less than 5 minutes', async () => {
      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC6,
          region: 'eastus',
          diskSizeGB: 50,
          autoTerminateMinutes: 2 // Too short
        },
        purpose: 'Test'
      };

      await expect(service.provisionInstance(request)).rejects.toThrow(
        'Auto-terminate must be at least 5 minutes'
      );
    });
  });

  describe('getInstance', () => {
    it('should retrieve instance details', async () => {
      // First provision an instance
      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC6,
          region: 'eastus',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test Retrieval'
      };

      const provisioned = await service.provisionInstance(request);
      
      // Retrieve it
      const retrieved = await service.getInstance(provisioned.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(provisioned.id);
      expect(retrieved?.status).toBe(InstanceStatus.READY);
    }, 30000);

    it('should return null for non-existent instance', async () => {
      const instance = await service.getInstance('non-existent-id');
      expect(instance).toBeNull();
    });
  });

  describe('terminateInstance', () => {
    it('should terminate an instance successfully', async () => {
      // Provision an instance
      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AWS,
          instanceType: InstanceType.AWS_G4DN_XLARGE,
          region: 'us-east-1',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test Termination'
      };

      const instance = await service.provisionInstance(request);
      
      // Terminate it
      await service.terminateInstance(instance.id);

      // Verify termination
      const terminated = await service.getInstance(instance.id);
      expect(terminated?.status).toBe(InstanceStatus.TERMINATED);
      expect(terminated?.terminatedAt).toBeDefined();
      expect(terminated?.totalCost).toBeGreaterThan(0);
    }, 30000);

    it('should handle terminating already terminated instance', async () => {
      // Provision and terminate
      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC6,
          region: 'eastus',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test Double Termination'
      };

      const instance = await service.provisionInstance(request);
      await service.terminateInstance(instance.id);

      // Try to terminate again - should not throw
      await expect(service.terminateInstance(instance.id)).resolves.not.toThrow();
    }, 30000);

    it('should throw error for non-existent instance', async () => {
      await expect(service.terminateInstance('non-existent-id')).rejects.toThrow(
        'Instance not found'
      );
    });
  });

  describe('listInstances', () => {
    beforeEach(async () => {
      // Clean up before each test
      await prisma.cloudInstance.deleteMany({
        where: { userId: TEST_USER_ID }
      });
    });

    it('should list all instances for a user', async () => {
      // Provision multiple instances
      const request1: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC6,
          region: 'eastus',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test List 1'
      };

      const request2: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AWS,
          instanceType: InstanceType.AWS_G4DN_XLARGE,
          region: 'us-east-1',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test List 2'
      };

      await service.provisionInstance(request1);
      await service.provisionInstance(request2);

      const instances = await service.listInstances(TEST_USER_ID);

      expect(instances).toHaveLength(2);
      expect(instances[0].status).toBe(InstanceStatus.READY);
      expect(instances[1].status).toBe(InstanceStatus.READY);
    }, 60000);

    it('should filter instances by status', async () => {
      // Provision and terminate one instance
      const request1: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC6,
          region: 'eastus',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test Filter 1'
      };

      const request2: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AWS,
          instanceType: InstanceType.AWS_G4DN_XLARGE,
          region: 'us-east-1',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test Filter 2'
      };

      const instance1 = await service.provisionInstance(request1);
      await service.provisionInstance(request2);
      
      await service.terminateInstance(instance1.id);

      // Filter by READY status
      const readyInstances = await service.listInstances(TEST_USER_ID, InstanceStatus.READY);
      expect(readyInstances).toHaveLength(1);
      expect(readyInstances[0].status).toBe(InstanceStatus.READY);

      // Filter by TERMINATED status
      const terminatedInstances = await service.listInstances(TEST_USER_ID, InstanceStatus.TERMINATED);
      expect(terminatedInstances).toHaveLength(1);
      expect(terminatedInstances[0].status).toBe(InstanceStatus.TERMINATED);
    }, 60000);
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      // Clean up before each test
      await prisma.cloudInstance.deleteMany({
        where: { userId: TEST_USER_ID }
      });
    });

    it('should calculate statistics correctly', async () => {
      // Provision and terminate some instances
      const request1: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC6,
          region: 'eastus',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test Stats 1'
      };

      const request2: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AWS,
          instanceType: InstanceType.AWS_G4DN_XLARGE,
          region: 'us-east-1',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test Stats 2'
      };

      const instance1 = await service.provisionInstance(request1);
      const instance2 = await service.provisionInstance(request2);
      
      await service.terminateInstance(instance1.id);

      const stats = await service.getStatistics(TEST_USER_ID);

      expect(stats.totalProvisioned).toBe(2);
      expect(stats.currentlyRunning).toBe(1);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.providerBreakdown[CloudProvider.AZURE]).toBe(1);
      expect(stats.providerBreakdown[CloudProvider.AWS]).toBe(1);
      expect(stats.instanceTypeBreakdown[InstanceType.AZURE_NC6]).toBe(1);
      expect(stats.instanceTypeBreakdown[InstanceType.AWS_G4DN_XLARGE]).toBe(1);
    }, 60000);

    it('should return zero statistics for user with no instances', async () => {
      const stats = await service.getStatistics('non-existent-user');

      expect(stats.totalProvisioned).toBe(0);
      expect(stats.currentlyRunning).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.averageCost).toBe(0);
    });
  });

  describe('Cost Calculations', () => {
    it('should calculate costs correctly for Azure instances', async () => {
      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC12,
          region: 'eastus',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test Cost Calculation'
      };

      const instance = await service.provisionInstance(request);
      
      // Wait a bit to accumulate some cost
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await service.terminateInstance(instance.id);

      const terminated = await service.getInstance(instance.id);
      
      expect(terminated?.costPerHour).toBe(1.80); // Azure NC12 cost
      expect(terminated?.totalCost).toBeGreaterThan(0);
      expect(terminated?.totalCost).toBeLessThan(0.01); // Should be very small for 2 seconds
    }, 30000);

    it('should calculate costs correctly for AWS instances', async () => {
      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AWS,
          instanceType: InstanceType.AWS_P3_2XLARGE,
          region: 'us-east-1',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test AWS Cost'
      };

      const instance = await service.provisionInstance(request);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await service.terminateInstance(instance.id);

      const terminated = await service.getInstance(instance.id);
      
      expect(terminated?.costPerHour).toBe(3.06); // AWS P3.2xlarge cost
      expect(terminated?.totalCost).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Event Emissions', () => {
    it('should emit events during instance lifecycle', async () => {
      const events: string[] = [];

      service.on('instance:provisioning', () => events.push('provisioning'));
      service.on('instance:provisioned', () => events.push('provisioned'));
      service.on('instance:ready', () => events.push('ready'));
      service.on('instance:stopping', () => events.push('stopping'));
      service.on('instance:terminated', () => events.push('terminated'));

      const request: ProvisionRequest = {
        userId: TEST_USER_ID,
        taskId: TEST_TASK_ID,
        config: {
          provider: CloudProvider.AZURE,
          instanceType: InstanceType.AZURE_NC6,
          region: 'eastus',
          diskSizeGB: 50,
          autoTerminateMinutes: 60
        },
        purpose: 'Test Events'
      };

      const instance = await service.provisionInstance(request);
      await service.terminateInstance(instance.id);

      expect(events).toContain('provisioning');
      expect(events).toContain('provisioned');
      expect(events).toContain('ready');
      expect(events).toContain('stopping');
      expect(events).toContain('terminated');

      // Clean up listeners
      service.removeAllListeners();
    }, 30000);
  });
});