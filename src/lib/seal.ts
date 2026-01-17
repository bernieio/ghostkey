import { SEAL_CONFIG, PACKAGE_ID } from './constants';

/**
 * Generate Seal ID for content encryption
 * 
 * The seal_id is a deterministic identifier that links encrypted content
 * to on-chain access control. When Seal key servers receive a decryption
 * request, they call seal_approve_access on-chain to verify the requester
 * has a valid AccessPass.
 * 
 * Format: {packageId}::{moduleName}::{functionName}::{uniqueNonce}
 */
export function generateSealId(): string {
  // Generate a unique nonce for this content
  const nonce = crypto.randomUUID().replace(/-/g, '');
  
  return `${SEAL_CONFIG.packageId}::${SEAL_CONFIG.moduleName}::${SEAL_CONFIG.functionName}::${nonce}`;
}

/**
 * Encrypt content using Seal Protocol
 * 
 * In production, this would use the actual @mysten/seal SDK to:
 * 1. Generate encryption keys
 * 2. Encrypt content with AES-GCM
 * 3. Split key shares to Seal key servers
 * 
 * For now, we implement a placeholder that demonstrates the encryption flow.
 * The actual Seal SDK integration requires the key server endpoints.
 */
export async function encryptWithSeal(
  content: Uint8Array,
  sealId: string
): Promise<Uint8Array> {
  // Generate a random encryption key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the content
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    content.buffer as ArrayBuffer
  );
  // Export the key
  const exportedKey = await crypto.subtle.exportKey('raw', key);

  // Create a simple envelope format:
  // [4 bytes: seal_id length][seal_id][12 bytes: IV][32 bytes: key][encrypted data]
  // 
  // NOTE: In production with real Seal integration, the key would NOT be stored here.
  // Instead, key shares would be distributed to Seal key servers.
  const sealIdBytes = new TextEncoder().encode(sealId);
  const sealIdLength = new Uint32Array([sealIdBytes.length]);
  
  const envelope = new Uint8Array(
    4 + sealIdBytes.length + 12 + 32 + encrypted.byteLength
  );
  
  let offset = 0;
  envelope.set(new Uint8Array(sealIdLength.buffer), offset);
  offset += 4;
  envelope.set(sealIdBytes, offset);
  offset += sealIdBytes.length;
  envelope.set(iv, offset);
  offset += 12;
  envelope.set(new Uint8Array(exportedKey), offset);
  offset += 32;
  envelope.set(new Uint8Array(encrypted), offset);

  return envelope;
}

/**
 * Decrypt content using Seal Protocol
 * 
 * In production, this would:
 * 1. Request key reconstruction from Seal key servers
 * 2. Key servers call seal_approve_access on-chain
 * 3. If approved, reconstruct and return decryption key
 * 4. Decrypt content locally
 */
export async function decryptWithSeal(
  encryptedEnvelope: Uint8Array,
  accessPassId: string
): Promise<{ content: Uint8Array; sealId: string }> {
  // Parse the envelope
  let offset = 0;
  
  const sealIdLength = new Uint32Array(encryptedEnvelope.slice(0, 4).buffer)[0];
  offset += 4;
  
  const sealIdBytes = encryptedEnvelope.slice(offset, offset + sealIdLength);
  const sealId = new TextDecoder().decode(sealIdBytes);
  offset += sealIdLength;
  
  const iv = encryptedEnvelope.slice(offset, offset + 12);
  offset += 12;
  
  const keyBytes = encryptedEnvelope.slice(offset, offset + 32);
  offset += 32;
  
  const encryptedData = encryptedEnvelope.slice(offset);

  // Import the key
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );

  return {
    content: new Uint8Array(decrypted),
    sealId,
  };
}

/**
 * Verify that a seal_id matches the expected format for our package
 */
export function verifySealId(sealId: string): boolean {
  const expectedPrefix = `${PACKAGE_ID}::${SEAL_CONFIG.moduleName}::${SEAL_CONFIG.functionName}::`;
  return sealId.startsWith(expectedPrefix);
}
