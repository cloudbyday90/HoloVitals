import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HoloVitals database...');
  console.log('');

  // ============================================================================
  // ROLES AND PERMISSIONS
  // ============================================================================
  
  console.log('👥 Creating default roles...');
  
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'OWNER' },
      update: {},
      create: {
        name: 'OWNER',
        description: 'Platform owner with full system access',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrator with elevated privileges',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.role.upsert({
      where: { name: 'DOCTOR' },
      update: {},
      create: {
        name: 'DOCTOR',
        description: 'Healthcare provider with customer access',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.role.upsert({
      where: { name: 'NURSE' },
      update: {},
      create: {
        name: 'NURSE',
        description: 'Nursing staff with limited customer access',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: {
        name: 'CUSTOMER',
        description: 'Customer user with access to own records',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.role.upsert({
      where: { name: 'SUPPORT' },
      update: {},
      create: {
        name: 'SUPPORT',
        description: 'Support staff with limited system access',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.role.upsert({
      where: { name: 'ANALYST' },
      update: {},
      create: {
        name: 'ANALYST',
        description: 'Data analyst with read-only access',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${roles.length} default roles`);
  console.log('');

  console.log('🔐 Creating default permissions...');
  
  const permissions = await Promise.all([
    // PHI Permissions
    prisma.permission.upsert({
      where: { name: 'READ_PHI' },
      update: {},
      create: {
        name: 'READ_PHI',
        description: 'Read protected health information',
        scope: 'PHI',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.permission.upsert({
      where: { name: 'WRITE_PHI' },
      update: {},
      create: {
        name: 'WRITE_PHI',
        description: 'Write protected health information',
        scope: 'PHI',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.permission.upsert({
      where: { name: 'DELETE_PHI' },
      update: {},
      create: {
        name: 'DELETE_PHI',
        description: 'Delete protected health information',
        scope: 'PHI',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    
    // System Permissions
    prisma.permission.upsert({
      where: { name: 'MANAGE_USERS' },
      update: {},
      create: {
        name: 'MANAGE_USERS',
        description: 'Manage user accounts',
        scope: 'SYSTEM',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.permission.upsert({
      where: { name: 'MANAGE_ROLES' },
      update: {},
      create: {
        name: 'MANAGE_ROLES',
        description: 'Manage roles and permissions',
        scope: 'SYSTEM',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.permission.upsert({
      where: { name: 'VIEW_AUDIT_LOGS' },
      update: {},
      create: {
        name: 'VIEW_AUDIT_LOGS',
        description: 'View audit logs',
        scope: 'AUDIT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.permission.upsert({
      where: { name: 'MANAGE_SECURITY' },
      update: {},
      create: {
        name: 'MANAGE_SECURITY',
        description: 'Manage security settings',
        scope: 'SECURITY',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    
    // EHR Permissions
    prisma.permission.upsert({
      where: { name: 'MANAGE_EHR' },
      update: {},
      create: {
        name: 'MANAGE_EHR',
        description: 'Manage EHR integrations',
        scope: 'EHR',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} default permissions`);
  console.log('');

  // ============================================================================
  // DATA RETENTION POLICIES
  // ============================================================================
  
  console.log('📋 Creating data retention policies...');
  
  const retentionPolicies = await Promise.all([
    prisma.dataRetentionPolicy.upsert({
      where: { name: 'AUDIT_LOGS' },
      update: {},
      create: {
        name: 'AUDIT_LOGS',
        description: 'HIPAA-compliant audit log retention (7 years)',
        retentionPeriodDays: 2555, // 7 years
        dataType: 'AUDIT_LOG',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.dataRetentionPolicy.upsert({
      where: { name: 'MEDICAL_RECORDS' },
      update: {},
      create: {
        name: 'MEDICAL_RECORDS',
        description: 'Medical record retention (10 years)',
        retentionPeriodDays: 3650, // 10 years
        dataType: 'MEDICAL_RECORD',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.dataRetentionPolicy.upsert({
      where: { name: 'PATIENT_DOCUMENTS' },
      update: {},
      create: {
        name: 'PATIENT_DOCUMENTS',
        description: 'Customer document retention (10 years)',
        retentionPeriodDays: 3650, // 10 years
        dataType: 'DOCUMENT',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.dataRetentionPolicy.upsert({
      where: { name: 'SESSION_DATA' },
      update: {},
      create: {
        name: 'SESSION_DATA',
        description: 'User session data retention (90 days)',
        retentionPeriodDays: 90,
        dataType: 'SESSION',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.dataRetentionPolicy.upsert({
      where: { name: 'TEMPORARY_FILES' },
      update: {},
      create: {
        name: 'TEMPORARY_FILES',
        description: 'Temporary file retention (30 days)',
        retentionPeriodDays: 30,
        dataType: 'TEMP_FILE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${retentionPolicies.length} retention policies`);
  console.log('');

  // ============================================================================
  // SECURITY CONFIGURATION
  // ============================================================================
  
  console.log('🔒 Creating default security configuration...');
  
  const securityConfig = await prisma.securityConfiguration.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      passwordMinLength: 12,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 30,
      sessionTimeoutMinutes: 30,
      requireMfa: false,
      allowedIpRanges: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created default security configuration');
  console.log('');

  // ============================================================================
  // ENCRYPTION KEYS
  // ============================================================================
  
  console.log('🔑 Creating master encryption key...');
  
  const masterKey = await prisma.encryptionKey.upsert({
    where: { id: 'master-key-v1' },
    update: {},
    create: {
      id: 'master-key-v1',
      keyType: 'MASTER',
      algorithm: 'AES-256-GCM',
      keyData: crypto.randomBytes(32).toString('base64'),
      status: 'ACTIVE',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  console.log('✅ Created master encryption key');
  console.log('');

  // ============================================================================
  // MAYO CLINIC LOINC CODES (Sample Data)
  // ============================================================================
  
  console.log('🧪 Creating sample LOINC codes...');
  
  const loincCodes = await Promise.all([
    prisma.lOINCCode.upsert({
      where: { loincNumber: '2345-7' },
      update: {},
      create: {
        loincNumber: '2345-7',
        component: 'Glucose',
        property: 'MCnc',
        timing: 'Pt',
        system: 'Ser/Plas',
        scale: 'Qn',
        method: '',
        commonName: 'Glucose, Blood',
        category: 'CHEMISTRY',
        componentType: 'ANALYTE',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.lOINCCode.upsert({
      where: { loincNumber: '2160-0' },
      update: {},
      create: {
        loincNumber: '2160-0',
        component: 'Creatinine',
        property: 'MCnc',
        timing: 'Pt',
        system: 'Ser/Plas',
        scale: 'Qn',
        method: '',
        commonName: 'Creatinine, Blood',
        category: 'CHEMISTRY',
        componentType: 'ANALYTE',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.lOINCCode.upsert({
      where: { loincNumber: '6690-2' },
      update: {},
      create: {
        loincNumber: '6690-2',
        component: 'Leukocytes',
        property: 'NCnc',
        timing: 'Pt',
        system: 'Bld',
        scale: 'Qn',
        method: '',
        commonName: 'White Blood Cell Count',
        category: 'HEMATOLOGY',
        componentType: 'CELL_COUNT',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${loincCodes.length} sample LOINC codes`);
  console.log('');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  
  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  - Roles: ${roles.length}`);
  console.log(`  - Permissions: ${permissions.length}`);
  console.log(`  - Retention Policies: ${retentionPolicies.length}`);
  console.log(`  - Security Configuration: 1`);
  console.log(`  - Encryption Keys: 1`);
  console.log(`  - LOINC Codes: ${loincCodes.length}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Create admin user account');
  console.log('  2. Configure EHR integrations');
  console.log('  3. Import additional LOINC codes');
  console.log('  4. Set up monitoring and alerts');
  console.log('');
}

main()
  .catch((e) => {
    console.error('');
    console.error('❌ Error seeding database:');
    console.error(e);
    console.error('');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });