import { useCallback, useState } from 'react';
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
 * 
 * IMPORTANT: SDK is lazy-loaded only when upload() is called
 * This prevents runtime crashes from top-level imports
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
        // LAZY LOAD: Import Walrus SDK only when upload is triggered
        // This prevents top-level execution which can crash the app
        const { WalrusClient, WalrusFile } = await import('@mysten/walrus');
        const { getFullnodeUrl } = await import('@mysten/sui/client');
        const { NETWORK } = await import('@/lib/constants');

        // Create client instance at upload time
        const client = new WalrusClient({
          network: NETWORK as 'testnet' | 'mainnet',
          suiRpcUrl: getFullnodeUrl(NETWORK),
          uploadRelay: {
            host: 'https://upload-relay.testnet.walrus.space',
            sendTip: {
              max: 10_000_000, // 0.01 SUI max tip
            },
          },
        });
        
        // Create a WalrusFile from the data
        const file = WalrusFile.from({
          contents: data,
          identifier: `encrypted-content-${Date.now()}`,
        });
        
        // Use the ephemeral keypair from zkLogin for signing
        const signer = zkState.ephemeralKeypair;

        // Write files to Walrus using the SDK
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
        console.error('Walrus upload error:', e);
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
