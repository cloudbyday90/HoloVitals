import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@holovitals.com' },
    update: {},
    create: {
      email: 'test@holovitals.com',
      passwordHash: hashedPassword,
      mfaEnabled: false,
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create test patient
  const testPatient = await prisma.patient.upsert({
    where: { id: 'test-patient-id' },
    update: {},
    create: {
      id: 'test-patient-id',
      userId: testUser.id,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-01'),
    },
  });

  console.log('✅ Created test patient:', testPatient.firstName, testPatient.lastName);

  // Seed model performance data
  const models = [
    {
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      avgResponseTime: 1.5,
      avgTokensPerSecond: 50,
      successRate: 0.98,
      errorRate: 0.02,
      avgCostPerRequest: 0.002,
      avgCostPerToken: 0.000002,
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
    },
    {
      model: 'gpt-4-turbo',
      provider: 'openai',
      avgResponseTime: 3.5,
      avgTokensPerSecond: 30,
      successRate: 0.99,
      errorRate: 0.01,
      avgCostPerRequest: 0.05,
      avgCostPerToken: 0.00003,
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
    },
    {
      model: 'claude-3-opus',
      provider: 'anthropic',
      avgResponseTime: 4.0,
      avgTokensPerSecond: 25,
      successRate: 0.99,
      errorRate: 0.01,
      avgCostPerRequest: 0.075,
      avgCostPerToken: 0.000045,
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
    },
    {
      model: 'claude-3-sonnet',
      provider: 'anthropic',
      avgResponseTime: 2.5,
      avgTokensPerSecond: 35,
      successRate: 0.98,
      errorRate: 0.02,
      avgCostPerRequest: 0.015,
      avgCostPerToken: 0.000009,
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
    },
  ];

  for (const modelData of models) {
    await prisma.modelPerformance.create({
      data: modelData,
    });
  }

  console.log('✅ Seeded model performance data');

  // Seed system health monitoring
  const components = [
    'chatbot',
    'queue',
    'provisioner',
    'database',
    'cache',
    'storage',
  ];

  for (const component of components) {
    await prisma.systemHealth.create({
      data: {
        component,
        status: 'healthy',
        responseTime: Math.random() * 100,
        errorRate: 0,
        throughput: Math.random() * 1000,
        cpuUsage: Math.random() * 50,
        memoryUsage: Math.random() * 60,
        diskUsage: Math.random() * 40,
      },
    });
  }

  console.log('✅ Seeded system health data');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });