/**
 * Logging System Initialization
 * Initialize log rotation and cleanup jobs
 */

import { logRotationService } from './LogRotationService';
import { logCleanupJob } from '../jobs/LogCleanupJob';

let loggingInitialized = false;

export async function initializeLogging() {
  if (loggingInitialized) {
    console.log('⚠️  Logging system already initialized');
    return;
  }

  try {
    console.log('📝 Initializing intelligent logging system...');

    // Initialize log rotation service
    await logRotationService.initialize();

    // Start cleanup jobs
    logCleanupJob.start();

    loggingInitialized = true;
    console.log('✅ Intelligent logging system initialized successfully');
    console.log('   Features enabled:');
    console.log('   - Error deduplication with counters');
    console.log('   - Master error code classification');
    console.log('   - Automatic log rotation');
    console.log('   - Scheduled cleanup jobs');
  } catch (error) {
    console.error('❌ Failed to initialize logging system:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📝 Stopping logging system...');
  logRotationService.stop();
  logCleanupJob.stop();
});

process.on('SIGINT', () => {
  console.log('📝 Stopping logging system...');
  logRotationService.stop();
  logCleanupJob.stop();
});