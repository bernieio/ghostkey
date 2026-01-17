import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { NETWORK } from './constants';

// zkLogin configuration
const PROVER_URL = 'https://prover-dev.mystenlabs.com/v1';
const SALT_SERVICE_URL = 'https://salt.api.mystenlabs.com/get_salt';

// Storage keys
const EPHEMERAL_KEYPAIR_KEY = 'ghostkey_ephemeral_keypair';
const ZKLOGIN_ADDRESS_KEY = 'ghostkey_zklogin_address';
const RANDOMNESS_KEY = 'ghostkey_randomness';
const MAX_EPOCH_KEY = 'ghostkey_max_epoch';
const USER_SALT_KEY = 'ghostkey_user_salt';

export interface ZkLoginState {
  address: string | null;
  ephemeralKeypair: Ed25519Keypair | null;
  userSalt: string | null;
  randomness: string | null;
  maxEpoch: number | null;
  jwtToken: string | null;
}

// Generate random bytes as hex string
function generateRandomness(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Generate a deterministic salt from user ID (in production, use a proper salt service)
export function generateUserSalt(userId: string): string {
  // Create a deterministic hash from the user ID
  // In production, this should come from a salt service
  const encoder = new TextEncoder();
  const data = encoder.encode(`ghostkey_salt_${userId}`);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
}

// Create or retrieve ephemeral keypair
export function getOrCreateEphemeralKeypair(): { keypair: Ed25519Keypair; isNew: boolean } {
  const stored = localStorage.getItem(EPHEMERAL_KEYPAIR_KEY);
  
  if (stored) {
    try {
      const secretKey = Uint8Array.from(JSON.parse(stored));
      return { keypair: Ed25519Keypair.fromSecretKey(secretKey), isNew: false };
    } catch (e) {
      console.error('Failed to restore ephemeral keypair:', e);
    }
  }
  
  const keypair = new Ed25519Keypair();
  localStorage.setItem(EPHEMERAL_KEYPAIR_KEY, JSON.stringify(Array.from(keypair.getSecretKey())));
  return { keypair, isNew: true };
}

// Store zkLogin state
export function storeZkLoginState(state: Partial<ZkLoginState>) {
  if (state.address) localStorage.setItem(ZKLOGIN_ADDRESS_KEY, state.address);
  if (state.randomness) localStorage.setItem(RANDOMNESS_KEY, state.randomness);
  if (state.maxEpoch) localStorage.setItem(MAX_EPOCH_KEY, state.maxEpoch.toString());
  if (state.userSalt) localStorage.setItem(USER_SALT_KEY, state.userSalt);
}

// Retrieve zkLogin state
export function getZkLoginState(): Partial<ZkLoginState> {
  const address = localStorage.getItem(ZKLOGIN_ADDRESS_KEY);
  const randomness = localStorage.getItem(RANDOMNESS_KEY);
  const maxEpochStr = localStorage.getItem(MAX_EPOCH_KEY);
  const userSalt = localStorage.getItem(USER_SALT_KEY);
  
  const { keypair } = getOrCreateEphemeralKeypair();
  
  return {
    address,
    randomness,
    maxEpoch: maxEpochStr ? parseInt(maxEpochStr, 10) : null,
    userSalt,
    ephemeralKeypair: keypair,
  };
}

// Clear zkLogin state (on logout)
export function clearZkLoginState() {
  localStorage.removeItem(EPHEMERAL_KEYPAIR_KEY);
  localStorage.removeItem(ZKLOGIN_ADDRESS_KEY);
  localStorage.removeItem(RANDOMNESS_KEY);
  localStorage.removeItem(MAX_EPOCH_KEY);
  localStorage.removeItem(USER_SALT_KEY);
}

// Get current epoch from Sui network
export async function getCurrentEpoch(): Promise<number> {
  const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });
  const { epoch } = await client.getLatestSuiSystemState();
  return parseInt(epoch, 10);
}

// Derive zkLogin address
// Note: This is a simplified version. Full implementation requires the actual zkLogin SDK
export async function deriveZkLoginAddress(params: {
  jwt: string;
  userSalt: string;
  ephemeralPublicKey: string;
}): Promise<string> {
  // In a full implementation, this would:
  // 1. Parse the JWT to extract iss, sub, aud
  // 2. Use the zkLogin SDK to compute the address
  // 
  // For now, we derive a deterministic address from the user salt
  // This is a placeholder - in production, use @mysten/zklogin
  
  const encoder = new TextEncoder();
  const data = encoder.encode(`${params.userSalt}${params.ephemeralPublicKey}`);
  
  // Create a pseudo-address from the hash (32 bytes = 64 hex chars)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const address = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return address;
}

// Initialize zkLogin for a user
export async function initializeZkLogin(userId: string, jwt: string): Promise<{
  address: string;
  isNewWallet: boolean;
}> {
  const storedState = getZkLoginState();
  
  // Check if we already have an address for this user
  if (storedState.address && storedState.userSalt) {
    return { address: storedState.address, isNewWallet: false };
  }
  
  // Generate or retrieve components
  const { keypair, isNew } = getOrCreateEphemeralKeypair();
  const randomness = storedState.randomness || generateRandomness();
  const userSalt = generateUserSalt(userId);
  const currentEpoch = await getCurrentEpoch();
  const maxEpoch = currentEpoch + 10; // Valid for 10 epochs
  
  // Derive the zkLogin address
  const address = await deriveZkLoginAddress({
    jwt,
    userSalt,
    ephemeralPublicKey: keypair.getPublicKey().toBase64(),
  });
  
  // Store the state
  storeZkLoginState({
    address,
    randomness,
    maxEpoch,
    userSalt,
  });
  
  return { address, isNewWallet: isNew };
}

// Sign and execute a transaction using zkLogin
// Note: This is a simplified placeholder. Full implementation requires ZK proofs.
export async function signAndExecuteWithZkLogin(
  transaction: Transaction,
  zkLoginState: ZkLoginState
): Promise<{ digest: string }> {
  // In a full implementation, this would:
  // 1. Generate a ZK proof using the prover service
  // 2. Create a zkLogin signature
  // 3. Submit the transaction
  //
  // For this MVP, we throw an error since full zkLogin requires more infrastructure
  throw new Error(
    'Full zkLogin transaction signing requires ZK proof generation. ' +
    'For MVP testing, please use a regular wallet extension.'
  );
}

// Check if zkLogin is properly initialized
export function isZkLoginInitialized(): boolean {
  const state = getZkLoginState();
  return !!(state.address && state.userSalt && state.ephemeralKeypair);
}
