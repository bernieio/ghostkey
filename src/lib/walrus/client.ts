import { WalrusClient } from '@mysten/walrus';
import { getFullnodeUrl } from '@mysten/sui/client';
import { NETWORK } from '../constants';

// Walrus upload relay for reduced request overhead
const UPLOAD_RELAY_HOST = 'https://upload-relay.testnet.walrus.space';

let walrusClientInstance: WalrusClient | null = null;

/**
 * Get a singleton WalrusClient instance
 */
export function getWalrusClient(): WalrusClient {
  if (!walrusClientInstance) {
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
 * Download a blob from Walrus using the SDK
 * Reading from Walrus works from browsers without CORS issues
 */
export async function downloadFromWalrus(blobId: string): Promise<Uint8Array> {
  const client = getWalrusClient();
  const data = await client.readBlob({ blobId });
  return data;
}
