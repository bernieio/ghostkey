import { useCallback, useState } from 'react';
import { getZkLoginState } from '@/lib/zklogin';

interface UseWalrusUploadResult {
  upload: (data: Uint8Array, epochs?: number) => Promise<string>;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

interface WalrusNewlyCreated {
  newlyCreated: {
    blobObject: {
      blobId: string;
    };
  };
}

interface WalrusAlreadyCertified {
  alreadyCertified: {
    blobId: string;
  };
}

type WalrusResponse = WalrusNewlyCreated | WalrusAlreadyCertified;

/**
 * Hook for uploading blobs to Walrus via Vercel serverless proxy
 * 
 * Uses /api/walrus/upload to avoid:
 * - Browser CORS issues
 * - Testnet rate limits (429/503)
 * 
 * The proxy is stateless, non-custodial, and does not manage WAL or private keys.
 */
export function useWalrusUpload(): UseWalrusUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const upload = useCallback(
    async (data: Uint8Array, _epochs = 5): Promise<string> => {
      const zkState = getZkLoginState();
      
      if (!zkState.address) {
        throw new Error('Wallet not connected. Please sign in first.');
      }

      setIsUploading(true);
      setError(null);

      // Exponential backoff retry logic
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Wait before retry (exponential backoff)
          if (attempt > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
            console.log(`Retry attempt ${attempt + 1}, waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          // Call Vercel serverless proxy instead of Walrus directly
          // This avoids CORS and reduces rate limiting
          // Convert Uint8Array to ArrayBuffer for fetch body
          const arrayBuffer = new ArrayBuffer(data.length);
          new Uint8Array(arrayBuffer).set(data);
          
          const response = await fetch('/api/walrus/upload', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            body: arrayBuffer,
          });

          if (!response.ok) {
            const errorText = await response.text();
            
            // Handle rate limiting - retry
            if (response.status === 429 || response.status === 503) {
              lastError = new Error(`Walrus rate limited (${response.status}). Retrying...`);
              console.warn(lastError.message);
              continue;
            }
            
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
          }

          const result: WalrusResponse = await response.json();
          
          // Extract blobId from response
          let blobId: string;
          if ('newlyCreated' in result) {
            blobId = result.newlyCreated.blobObject.blobId;
          } else if ('alreadyCertified' in result) {
            blobId = result.alreadyCertified.blobId;
          } else {
            throw new Error('Unexpected Walrus response format');
          }

          console.log('Walrus upload successful via proxy:', blobId);
          return blobId;
          
        } catch (e: unknown) {
          lastError = e instanceof Error ? e : new Error('Unknown error');
          
          // Don't retry on non-retryable errors
          if (!lastError.message.includes('rate limited') && 
              !lastError.message.includes('429') && 
              !lastError.message.includes('503')) {
            break;
          }
        }
      }

      // All retries exhausted
      const errorMessage = lastError?.message || 'Walrus upload failed after retries';
      console.error('Walrus upload error:', lastError);
      setError(errorMessage);
      throw lastError || new Error(errorMessage);
    },
    []
  );

  // Cleanup on unmount
  const wrappedUpload = useCallback(
    async (data: Uint8Array, epochs?: number): Promise<string> => {
      try {
        return await upload(data, epochs);
      } finally {
        setIsUploading(false);
      }
    },
    [upload]
  );

  return { upload: wrappedUpload, isUploading, error, clearError };
}
