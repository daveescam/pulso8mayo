/**
 * Inventory Checks Cron Job
 *
 * Checks for low stock and expiring products, sends alerts
 * Run frequency: Every 6 hours
 *
 * NOTE: This cron job is currently disabled pending schema updates.
 * The inventoryItems table exists but the calculated stock logic
 * and notification dispatching require updates.
 */

import { createChildLogger } from '@/lib/logger';

const logger = createChildLogger('cron:inventory');

export async function checkInventoryAlerts() {
  try {
    logger.info('Inventory checks skipped (Schema update pending - see CONCERNS.md)');
    return { success: true, status: 'skipped', reason: 'Schema update pending' };
  } catch (error) {
    logger.error({ error }, 'Inventory checks job failed');
    return { success: false, error: String(error) };
  }
}

// FUTURE: Implement low stock and expiring batch checks
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkLowStockStub() {
  // TODO: Implement when inventory stock calculations are finalized
  // Requires: calculated stock levels, minLevel thresholds
  logger.debug('Low stock check stub - not implemented');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkExpiringBatchesStub() {
  // TODO: Implement when batch tracking is finalized
  // Requires: inventoryBatches table with expiration dates
  logger.debug('Expiring batches check stub - not implemented');
}
