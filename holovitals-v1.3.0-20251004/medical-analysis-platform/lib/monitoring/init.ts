/**
 * Monitoring Initialization
 * Start server monitoring when the application starts
 */

import { serverMonitoring } from '../services/ServerMonitoringService';

let monitoringInitialized = false;

export async function initializeMonitoring() {
  if (monitoringInitialized) {
    console.log('⚠️  Monitoring already initialized');
    return;
  }

  try {
    console.log('🔍 Initializing server monitoring...');
    
    // Start monitoring with 1-minute intervals
    await serverMonitoring.startMonitoring(60000);
    
    monitoringInitialized = true;
    console.log('✅ Server monitoring initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize monitoring:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📊 Stopping server monitoring...');
  serverMonitoring.stopMonitoring();
});

process.on('SIGINT', () => {
  console.log('📊 Stopping server monitoring...');
  serverMonitoring.stopMonitoring();
});