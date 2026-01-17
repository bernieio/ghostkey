import { useCallback, useState } from 'react';
import { WalrusFile } from '@mysten/walrus';
import { getWalrusClient } from '@/lib/walrus/client';
import { getZkLoginState } from '@/lib/zklogin';

interface UseWalrusUploadResult {
  upload: (data: Uint8Array, epochs?: number) => Promise<string>;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for uploading blobs to Walrus using the SDK
 * Uses zkLogin-derived ephemeral keypair for signing
 */
export function useWalrusUpload(): UseWalrusUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const upload = useCallback(
    async (data: Uint8Array, epochs = 5): Promise<string> => {
      const zkState = getZkLoginState();
      
      if (!zkState.address) {
        throw new Error('Wallet not connected. Please sign in first.');
      }

      if (!zkState.ephemeralKeypair) {
        throw new Error('Ephemeral keypair not found. Please sign in again.');
      }

      setIsUploading(true);
      setError(null);

      try {
        const client = getWalrusClient();
        
        // Create a WalrusFile from the data
        const file = WalrusFile.from({
          contents: data,
          identifier: `encrypted-content-${Date.now()}`,
        });
        
        // Use the ephemeral keypair from zkLogin for signing
        const signer = zkState.ephemeralKeypair;

        // Write files to Walrus using the SDK
        // WalrusClient has writeFiles method directly (not under .walrus)
        const results = await client.writeFiles({
          files: [file],
          epochs,
          deletable: false,
          signer,
        });

        if (!results || results.length === 0) {
          throw new Error('No blob ID returned from Walrus');
        }

        const blobId = results[0].blobId;
        console.log('Walrus SDK upload successful:', blobId);
        return blobId;
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Walrus upload failed';
        setError(errorMessage);
        throw e;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return { upload, isUploading, error, clearError };
}
