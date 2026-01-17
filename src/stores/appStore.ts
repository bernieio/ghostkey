import { create } from 'zustand';
import type { Listing, AccessPass, UploadState, RentState, ViewerState } from '@/lib/types';

interface AppState {
  // Listings
  listings: Listing[];
  setListings: (listings: Listing[]) => void;
  addListing: (listing: Listing) => void;

  // User's access passes
  accessPasses: AccessPass[];
  setAccessPasses: (passes: AccessPass[]) => void;

  // Upload state
  upload: UploadState;
  setUpload: (upload: Partial<UploadState>) => void;
  resetUpload: () => void;

  // Rent state
  rent: RentState;
  setRent: (rent: Partial<RentState>) => void;
  resetRent: () => void;

  // Viewer state
  viewer: ViewerState;
  setViewer: (viewer: Partial<ViewerState>) => void;
  resetViewer: () => void;
}

const initialUploadState: UploadState = {
  file: null,
  title: '',
  description: '',
  basePrice: '0.1',
  priceSlope: '0.01',
  step: 'select',
  error: null,
  blobId: null,
  sealId: null,
  listingId: null,
};

const initialRentState: RentState = {
  duration: 24,
  step: 'idle',
  error: null,
  accessPassId: null,
};

const initialViewerState: ViewerState = {
  step: 'loading',
  error: null,
  decryptedContent: null,
  mimeType: null,
};

export const useAppStore = create<AppState>((set) => ({
  // Listings
  listings: [],
  setListings: (listings) => set({ listings }),
  addListing: (listing) => set((state) => ({ listings: [...state.listings, listing] })),

  // Access passes
  accessPasses: [],
  setAccessPasses: (accessPasses) => set({ accessPasses }),

  // Upload
  upload: initialUploadState,
  setUpload: (upload) => set((state) => ({ upload: { ...state.upload, ...upload } })),
  resetUpload: () => set({ upload: initialUploadState }),

  // Rent
  rent: initialRentState,
  setRent: (rent) => set((state) => ({ rent: { ...state.rent, ...rent } })),
  resetRent: () => set({ rent: initialRentState }),

  // Viewer
  viewer: initialViewerState,
  setViewer: (viewer) => set((state) => ({ viewer: { ...state.viewer, ...viewer } })),
  resetViewer: () => set({ viewer: initialViewerState }),
}));
