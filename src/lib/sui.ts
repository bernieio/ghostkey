import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME, EVENT_TYPES, OBJECT_TYPES, NETWORK } from './constants';
import type { Listing, AccessPass, ListingCreatedEvent, AccessRentedEvent } from './types';

// Create Sui client for testnet
export const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });

/**
 * Query all ListingCreated events to build listings list
 */
export async function fetchAllListings(): Promise<Listing[]> {
  const events = await suiClient.queryEvents({
    query: { MoveEventType: EVENT_TYPES.LISTING_CREATED },
    order: 'descending',
  });

  const listings: Listing[] = [];

  for (const event of events.data) {
    const parsed = event.parsedJson as ListingCreatedEvent;
    
    try {
      // Fetch the actual listing object to get current state
      const listingObject = await suiClient.getObject({
        id: parsed.listing_id,
        options: { showContent: true },
      });

      if (listingObject.data?.content?.dataType === 'moveObject') {
        const fields = listingObject.data.content.fields as Record<string, unknown>;
        
        listings.push({
          id: parsed.listing_id,
          objectId: parsed.listing_id,
          seller: parsed.seller,
          blobId: parsed.blob_id,
          sealId: parsed.seal_id,
          mimeType: parsed.mime_type,
          title: parsed.title,
          description: parsed.description,
          basePrice: BigInt(parsed.base_price),
          priceSlope: BigInt(parsed.price_slope),
          activeRentals: Number(fields.active_rentals || 0),
          totalRevenue: BigInt(String(fields.total_revenue || 0)),
          isActive: Boolean(fields.is_active ?? true),
          createdAt: Number(event.timestampMs || Date.now()),
        });
      }
    } catch (error) {
      console.error(`Failed to fetch listing ${parsed.listing_id}:`, error);
    }
  }

  return listings;
}

/**
 * Fetch a single listing by ID
 */
export async function fetchListing(listingId: string): Promise<Listing | null> {
  try {
    const listingObject = await suiClient.getObject({
      id: listingId,
      options: { showContent: true },
    });

    if (listingObject.data?.content?.dataType === 'moveObject') {
      const fields = listingObject.data.content.fields as Record<string, unknown>;
      
      return {
        id: listingId,
        objectId: listingId,
        seller: String(fields.seller || ''),
        blobId: String(fields.blob_id || ''),
        sealId: String(fields.seal_id || ''),
        mimeType: String(fields.mime_type || ''),
        title: String(fields.title || ''),
        description: String(fields.description || ''),
        basePrice: BigInt(String(fields.base_price || 0)),
        priceSlope: BigInt(String(fields.price_slope || 0)),
        activeRentals: Number(fields.active_rentals || 0),
        totalRevenue: BigInt(String(fields.total_revenue || 0)),
        isActive: Boolean(fields.is_active ?? true),
        createdAt: Date.now(),
      };
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch listing ${listingId}:`, error);
    return null;
  }
}

/**
 * Fetch user's AccessPass NFTs
 */
export async function fetchUserAccessPasses(address: string): Promise<AccessPass[]> {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: address,
      filter: { StructType: OBJECT_TYPES.ACCESS_PASS },
      options: { showContent: true },
    });

    const passes: AccessPass[] = [];

    for (const obj of objects.data) {
      if (obj.data?.content?.dataType === 'moveObject') {
        const fields = obj.data.content.fields as Record<string, unknown>;
        
        passes.push({
          id: obj.data.objectId,
          objectId: obj.data.objectId,
          listingId: String(fields.listing_id || ''),
          owner: address,
          expiresAt: Number(fields.expires_at || 0),
          purchasePrice: BigInt(String(fields.purchase_price || 0)),
        });
      }
    }

    return passes;
  } catch (error) {
    console.error('Failed to fetch access passes:', error);
    return [];
  }
}

/**
 * Build transaction for creating a listing
 */
export function buildCreateListingTx(params: {
  blobId: string;
  sealId: string;
  mimeType: string;
  title: string;
  description: string;
  basePrice: bigint;
  priceSlope: bigint;
}): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::create_listing`,
    arguments: [
      tx.pure.string(params.blobId),
      tx.pure.string(params.sealId),
      tx.pure.string(params.mimeType),
      tx.pure.string(params.title),
      tx.pure.string(params.description),
      tx.pure.u64(params.basePrice),
      tx.pure.u64(params.priceSlope),
    ],
  });

  return tx;
}

/**
 * Build transaction for renting access with max price protection
 */
export function buildRentAccessTx(params: {
  listingId: string;
  durationHours: number;
  paymentAmount: bigint;
  maxPrice: bigint;
  clockId?: string;
}): Transaction {
  const tx = new Transaction();
  
  // Split coins for payment
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.paymentAmount)]);

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::rent_access_with_max_price`,
    arguments: [
      tx.object(params.listingId),
      paymentCoin,
      tx.pure.u64(params.durationHours),
      tx.pure.u64(params.maxPrice),
      tx.object('0x6'), // Clock object
    ],
  });

  return tx;
}

/**
 * Calculate current rental price using bonding curve
 * Formula: (base_price + slope * active_rentals) * duration_hours
 */
export function calculateRentalPrice(
  basePrice: bigint,
  priceSlope: bigint,
  activeRentals: number,
  durationHours: number
): bigint {
  const hourlyRate = basePrice + priceSlope * BigInt(activeRentals);
  return hourlyRate * BigInt(durationHours);
}

/**
 * Format SUI amount from MIST
 */
export function formatSui(mist: bigint): string {
  const sui = Number(mist) / 1_000_000_000;
  return sui.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 4 
  });
}

/**
 * Parse SUI to MIST
 */
export function suiToMist(sui: string): bigint {
  const parsed = parseFloat(sui);
  if (isNaN(parsed) || parsed < 0) return BigInt(0);
  return BigInt(Math.floor(parsed * 1_000_000_000));
}
