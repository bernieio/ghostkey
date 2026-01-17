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
 * Upload encrypted content to Walrus
 * 
 * Note: The Walrus publisher endpoint may have CORS restrictions.
 * For production use, consider:
 * 1. Using a CORS proxy
 * 2. Using the @mysten/walrus SDK with a signer (requires WAL tokens for storage fees)
 * 3. Using a backend service to proxy uploads
 */
export async function uploadToWalrus(encryptedData: Uint8Array): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < WALRUS_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      // Create a new ArrayBuffer copy to avoid SharedArrayBuffer issues
      const arrayBuffer = new ArrayBuffer(encryptedData.length);
      new Uint8Array(arrayBuffer).set(encryptedData);
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      
      const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: blob,
      });

      if (response.status === 429 || response.status === 503) {
        // Rate limited or service unavailable - retry with backoff
        const backoffMs = getBackoffDelay(attempt);
        console.log(`Walrus returned ${response.status}, retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
        continue;
      }

      if (!response.ok) {
        // Check for CORS error indicators
        if (response.status === 0 || response.type === 'opaque') {
          throw new Error(
            'CORS blocked: The Walrus publisher does not allow direct browser uploads. ' +
            'For production, use a backend proxy or the @mysten/walrus SDK with a funded wallet.'
          );
        }
        throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Walrus returns different response formats for new vs existing blobs
      const blobId = result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId;
      
      if (!blobId) {
        throw new Error('No blob ID in Walrus response');
      }

      console.log('Walrus upload successful:', blobId);
      return blobId;
    } catch (error) {
      lastError = error as Error;
      
      // Check for network/CORS errors (fetch throws TypeError for CORS issues)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Network error: Unable to reach Walrus publisher. ' +
          'This may be due to CORS restrictions in browser environments. ' +
          'For production, use a backend proxy or the @mysten/walrus SDK with a funded wallet.'
        );
      }
      
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
 * Note: Reading from the aggregator typically works from browsers (CORS allowed)
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
