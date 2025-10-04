/**
 * Mock Prisma Client for Development Without Database
 * Allows the app to run when database is not available
 */

export const createMockPrismaClient = () => {
  const mockData = {
    users: [],
    patients: [],
    documents: [],
    ehrConnections: [],
    syncJobs: [],
  };

  return {
    user: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async (data: any) => ({ id: 'mock-user-1', ...data.data }),
      update: async (data: any) => ({ id: 'mock-user-1', ...data.data }),
      delete: async () => ({ id: 'mock-user-1' }),
    },
    patient: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async (data: any) => ({ id: 'mock-patient-1', ...data.data }),
      update: async (data: any) => ({ id: 'mock-patient-1', ...data.data }),
      delete: async () => ({ id: 'mock-patient-1' }),
    },
    eHRConnection: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async (data: any) => ({ id: 'mock-connection-1', ...data.data }),
      update: async (data: any) => ({ id: 'mock-connection-1', ...data.data }),
      delete: async () => ({ id: 'mock-connection-1' }),
    },
    syncJob: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async (data: any) => ({ id: 'mock-job-1', ...data.data }),
      update: async (data: any) => ({ id: 'mock-job-1', ...data.data }),
      delete: async () => ({ id: 'mock-job-1' }),
    },
    $connect: async () => {},
    $disconnect: async () => {},
    $queryRaw: async () => [],
    $executeRaw: async () => 0,
  };
};

export const useMockDatabase = process.env.USE_MOCK_DB === 'true';