/**
 * Database Connection Check Utility
 * Provides graceful handling when database is not available
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;
let dbAvailable: boolean | null = null;

export async function checkDatabaseConnection(): Promise<boolean> {
  // Return cached result if available
  if (dbAvailable !== null) {
    return dbAvailable;
  }

  try {
    if (!prisma) {
      prisma = new PrismaClient();
    }
    
    // Try a simple query
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    dbAvailable = false;
    return false;
  }
}

export function getDatabaseStatus(): {
  available: boolean;
  message: string;
  setupInstructions?: string;
} {
  if (dbAvailable === false) {
    return {
      available: false,
      message: 'Database not available',
      setupInstructions: `
To set up the database:

1. Install PostgreSQL:
   - Docker: docker run -d --name holovitals-postgres -p 5432:5432 -e POSTGRES_PASSWORD=holovitals_dev_password_2024 postgres:15
   - Or install locally from https://www.postgresql.org/download/

2. Create databases:
   - psql -U postgres -c "CREATE DATABASE holovitals;"
   - psql -U postgres -c "CREATE DATABASE holovitals_shadow;"

3. Run migrations:
   - cd medical-analysis-platform
   - npx prisma migrate dev

4. Restart the application
      `.trim(),
    };
  }

  return {
    available: true,
    message: 'Database connected',
  };
}