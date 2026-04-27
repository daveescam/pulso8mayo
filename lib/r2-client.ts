/**
 * R2 Client Wrapper
 *
 * Simple wrapper around lib/storage/r2-client for easier usage
 */

import { isR2Configured, uploadToR2 } from './storage/r2-client';

export const r2Client = {
  /**
   * Check if R2 is configured
   */
  isConfigured(): boolean {
    return isR2Configured();
  },

  /**
   * Upload a file to R2
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    return uploadToR2(file, key, contentType, metadata);
  },
};
