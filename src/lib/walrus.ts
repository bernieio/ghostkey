import { WALRUS_PUBLISHER, WALRUS_AGGREGATOR, WALRUS_RETRY_CONFIG } from './constants';

/**
 * Delay helper for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
  const exponentialDelay = WALRUS_RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(exponentialDelay, WALRUS_RETRY_CONFIG.maxDelay);
}

/**
 * Upload encrypted content to Walrus with retry logic
 */
export async function uploadToWalrus(encryptedData: Uint8Array): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < WALRUS_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: new Blob([encryptedData.buffer as ArrayBuffer]),
      });
      if (response.status === 429 || response.status === 503) {
        // Rate limited or service unavailable - retry with backoff
        const backoffMs = getBackoffDelay(attempt);
        console.log(`Walrus returned ${response.status}, retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Walrus returns different response formats for new vs existing blobs
      const blobId = result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId;
      
      if (!blobId) {
        throw new Error('No blob ID in Walrus response');
      }

      return blobId;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < WALRUS_RETRY_CONFIG.maxRetries - 1) {
        const backoffMs = getBackoffDelay(attempt);
        console.log(`Walrus upload error, retrying in ${backoffMs}ms...`, error);
        await delay(backoffMs);
      }
    }
  }

  throw lastError || new Error('Walrus upload failed after retries');
}

/**
 * Download blob from Walrus aggregator
 */
export async function downloadFromWalrus(blobId: string): Promise<Uint8Array> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < WALRUS_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);

      if (response.status === 429 || response.status === 503) {
        const backoffMs = getBackoffDelay(attempt);
        console.log(`Walrus returned ${response.status}, retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Walrus download failed: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < WALRUS_RETRY_CONFIG.maxRetries - 1) {
        const backoffMs = getBackoffDelay(attempt);
        console.log(`Walrus download error, retrying in ${backoffMs}ms...`, error);
        await delay(backoffMs);
      }
    }
  }

  throw lastError || new Error('Walrus download failed after retries');
}
