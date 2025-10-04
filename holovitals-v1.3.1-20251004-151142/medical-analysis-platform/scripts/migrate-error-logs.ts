/**
 * Migration Script for Error Log Deduplication
 * Run this script to migrate existing error logs to the new schema
 */

import { PrismaClient } from '@prisma/client';
import { ErrorCodeClassifier } from '../lib/errors/MasterErrorCodes';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function migrateErrorLogs() {
  console.log('🔄 Starting error log migration...');

  try {
    // Get all error logs without master codes
    const errors = await prisma.errorLog.findMany({
      where: {
        OR: [
          { masterCode: null },
          { errorHash: null },
          { firstSeen: null },
        ],
      },
    });

    console.log(`📊 Found ${errors.length} error logs to migrate`);

    let updated = 0;
    let failed = 0;

    for (const error of errors) {
      try {
        // Determine master code
        let masterCode: string | null = null;
        if (error.code) {
          masterCode = ErrorCodeClassifier.getMasterCode(error.code);
        }
        if (!masterCode) {
          masterCode = ErrorCodeClassifier.classifyByMessage(error.message);
        }

        // Generate error hash
        const hashInput = `${error.code || 'UNKNOWN'}:${error.message}:${error.endpoint || 'UNKNOWN'}`;
        const errorHash = crypto.createHash('md5').update(hashInput).digest('hex');

        // Update the error log
        await prisma.errorLog.update({
          where: { id: error.id },
          data: {
            masterCode: masterCode || undefined,
            errorHash,
            firstSeen: error.firstSeen || error.timestamp,
            lastSeen: error.lastSeen || error.timestamp,
            occurrenceCount: error.occurrenceCount || 1,
          },
        });

        updated++;

        if (updated % 100 === 0) {
          console.log(`   Processed ${updated}/${errors.length} errors...`);
        }
      } catch (err) {
        console.error(`   Failed to migrate error ${error.id}:`, err);
        failed++;
      }
    }

    console.log(`✅ Migration completed:`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Failed: ${failed}`);

    // Now deduplicate errors
    console.log('\n🔄 Starting deduplication...');
    await deduplicateErrors();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function deduplicateErrors() {
  // Find all error hashes with duplicates
  const duplicateGroups = await prisma.errorLog.groupBy({
    by: ['errorHash'],
    where: {
      errorHash: { not: null },
    },
    having: {
      errorHash: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  console.log(`📊 Found ${duplicateGroups.length} groups with duplicates`);

  let totalPurged = 0;

  for (const group of duplicateGroups) {
    if (!group.errorHash) continue;

    // Get all errors in this group
    const errors = await prisma.errorLog.findMany({
      where: { errorHash: group.errorHash },
      orderBy: { timestamp: 'asc' },
    });

    if (errors.length <= 1) continue;

    // Keep the first one (master), delete the rest
    const masterError = errors[0];
    const duplicateIds = errors.slice(1).map(e => e.id);

    // Calculate total occurrences
    const totalOccurrences = errors.reduce((sum, e) => sum + (e.occurrenceCount || 1), 0);

    // Collect all unique stack traces
    const allStacks: string[] = [];
    for (const error of errors) {
      if (error.stack && !allStacks.includes(error.stack)) {
        allStacks.push(error.stack);
      }
      if (error.sampleStacks) {
        try {
          const stacks = JSON.parse(error.sampleStacks as string);
          stacks.forEach((s: string) => {
            if (!allStacks.includes(s)) {
              allStacks.push(s);
            }
          });
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    // Keep only the 3 most recent stack traces
    const sampleStacks = allStacks.slice(0, 3);

    // Update master with total occurrences and latest timestamp
    await prisma.errorLog.update({
      where: { id: masterError.id },
      data: {
        occurrenceCount: totalOccurrences,
        lastSeen: errors[errors.length - 1].timestamp,
        sampleStacks: JSON.stringify(sampleStacks),
      },
    });

    // Delete duplicates
    const result = await prisma.errorLog.deleteMany({
      where: { id: { in: duplicateIds } },
    });

    totalPurged += result.count;

    if (totalPurged % 100 === 0) {
      console.log(`   Purged ${totalPurged} duplicates...`);
    }
  }

  console.log(`✅ Deduplication completed: Purged ${totalPurged} duplicate entries`);
}

// Run migration
migrateErrorLogs()
  .then(() => {
    console.log('\n✅ All migration tasks completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });