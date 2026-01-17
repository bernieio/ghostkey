// Core domain types for GhostKey

export interface Listing {
  id: string;
  objectId: string;
  seller: string;
  blobId: string;
  sealId: string;
  mimeType: string;
  title: string;
  description: string;
  basePrice: bigint;
  priceSlope: bigint;
  activeRentals: number;
  totalRevenue: bigint;
  isActive: boolean;
  createdAt: number;
}

export interface AccessPass {
  id: string;
  objectId: string;
  listingId: string;
  owner: string;
  expiresAt: number;
  purchasePrice: bigint;
}

export interface ListingCreatedEvent {
  listing_id: string;
  seller: string;
  blob_id: string;
  seal_id: string;
  mime_type: string;
  title: string;
  description: string;
  base_price: string;
  price_slope: string;
}

export interface AccessRentedEvent {
  listing_id: string;
  access_pass_id: string;
  renter: string;
  duration_hours: string;
  price_paid: string;
  expires_at: string;
}

export interface UploadState {
  file: File | null;
  title: string;
  description: string;
  basePrice: string;
  priceSlope: string;
  step: 'select' | 'encrypting' | 'uploading' | 'listing' | 'complete' | 'error';
  error: string | null;
  blobId: string | null;
  sealId: string | null;
  listingId: string | null;
}

export interface RentState {
  duration: number;
  step: 'idle' | 'calculating' | 'paying' | 'complete' | 'error';
  error: string | null;
  accessPassId: string | null;
}

export interface ViewerState {
  step: 'loading' | 'decrypting' | 'ready' | 'error';
  error: string | null;
  decryptedContent: Uint8Array | null;
  mimeType: string | null;
}

// Wallet state
export interface WalletState {
  address: string | null;
  isConnected: boolean;
}
