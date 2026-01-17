// GhostKey Blockchain Configuration
export const NETWORK = 'testnet';

export const PACKAGE_ID = '0x0952e8bc1ea3b22ee1dab9e51a4197fb8fdea4cd80d418c946d305b82b6b2fb7';
export const MODULE_NAME = 'marketplace';

// Sui RPC endpoints
export const SUI_RPC_URL = 'https://fullnode.testnet.sui.io:443';

// Walrus Testnet endpoints
export const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
export const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

// Seal Protocol configuration
export const SEAL_CONFIG = {
  packageId: PACKAGE_ID,
  moduleName: MODULE_NAME,
  functionName: 'seal_approve_access',
};

// Move function names
export const MOVE_FUNCTIONS = {
  CREATE_LISTING: 'create_listing',
  RENT_ACCESS: 'rent_access',
  RENT_ACCESS_WITH_MAX_PRICE: 'rent_access_with_max_price',
  SEAL_APPROVE_ACCESS: 'seal_approve_access',
} as const;

// Type definitions for on-chain objects
export const OBJECT_TYPES = {
  LISTING: `${PACKAGE_ID}::${MODULE_NAME}::Listing`,
  ACCESS_PASS: `${PACKAGE_ID}::${MODULE_NAME}::AccessPass`,
} as const;

// Event types
export const EVENT_TYPES = {
  LISTING_CREATED: `${PACKAGE_ID}::${MODULE_NAME}::ListingCreated`,
  ACCESS_RENTED: `${PACKAGE_ID}::${MODULE_NAME}::AccessRented`,
} as const;

// Retry configuration for Walrus
export const WALRUS_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// Duration options in hours
export const DURATION_OPTIONS = [
  { label: '1 Hour', hours: 1 },
  { label: '6 Hours', hours: 6 },
  { label: '12 Hours', hours: 12 },
  { label: '24 Hours', hours: 24 },
  { label: '7 Days', hours: 168 },
  { label: '30 Days', hours: 720 },
];
