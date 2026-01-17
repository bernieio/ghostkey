import { getFullnodeUrl } from '@mysten/sui/client';
import { NETWORK } from '../constants';

// Walrus upload relay for reduced request overhead
const UPLOAD_RELAY_HOST = 'https://upload-relay.testnet.walrus.space';

// Store instance without typing to avoid import issues
let walrusClientInstance: unknown = null;

/**
 * Get a singleton WalrusClient instance - LAZY LOADED
 * This prevents runtime crashes by only loading the SDK when needed
 */
export async function getWalrusClient() {
  if (!walrusClientInstance) {
    // Dynamic import to prevent top-level execution
    const { WalrusClient } = await import('@mysten/walrus');
    
    walrusClientInstance = new WalrusClient({
      network: NETWORK as 'testnet' | 'mainnet',
      suiRpcUrl: getFullnodeUrl(NETWORK),
      uploadRelay: {
        host: UPLOAD_RELAY_HOST,
        sendTip: {
          max: 10_000_000, // 0.01 SUI max tip
        },
      },
    });
  }
  return walrusClientInstance;
}

/**
 * Reset the Walrus client (useful for testing or when network changes)
 */
export function resetWalrusClient(): void {
  walrusClientInstance = null;
}

/**
 * Download a blob from Walrus using the SDK - LAZY LOADED
 * Reading from Walrus works from browsers without CORS issues
 */
export async function downloadFromWalrus(blobId: string): Promise<Uint8Array> {
  const { WalrusClient } = await import('@mysten/walrus');
  const client = await getWalrusClient() as InstanceType<typeof WalrusClient>;
  const data = await client.readBlob({ blobId });
  return data;
}
