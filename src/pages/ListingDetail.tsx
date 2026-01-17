import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Layout } from '@/components/Layout';
import { PageLoadingState } from '@/components/LoadingState';
import { fetchListing, buildRentAccessTx, calculateRentalPrice, formatSui, suiToMist } from '@/lib/sui';
import { DURATION_OPTIONS } from '@/lib/constants';
import { useAppStore } from '@/stores/appStore';
import type { Listing } from '@/lib/types';
import { 
  ArrowLeft, 
  Clock, 
  Coins, 
  Users, 
  Shield, 
  FileText,
  Image,
  Video,
  Music,
  File,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.startsWith('text/')) return FileText;
  return File;
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending: isExecuting } = useSignAndExecuteTransaction();
  const { rent, setRent, resetRent } = useAppStore();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(24);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadListing() {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await fetchListing(id);
        setListing(data);
      } catch (error) {
        console.error('Failed to fetch listing:', error);
        setError('Failed to load listing');
      } finally {
        setIsLoading(false);
      }
    }

    loadListing();
    resetRent();
  }, [id, resetRent]);

  const calculatedPrice = listing 
    ? calculateRentalPrice(listing.basePrice, listing.priceSlope, listing.activeRentals, selectedDuration)
    : BigInt(0);

  const handleRent = async () => {
    if (!account || !listing || !id) return;

    setError(null);
    setSuccess(false);
    
    try {
      const maxPrice = calculatedPrice + (calculatedPrice * BigInt(10)) / BigInt(100); // 10% slippage
      
      const tx = buildRentAccessTx({
        listingId: id,
        durationHours: selectedDuration,
        paymentAmount: calculatedPrice,
        maxPrice,
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Rent successful:', result);
            setSuccess(true);
            setRent({ accessPassId: 'pending', step: 'complete' });
          },
          onError: (error) => {
            console.error('Rent failed:', error);
            setError(error.message || 'Transaction failed');
          },
        }
      );
    } catch (error) {
      console.error('Failed to build transaction:', error);
      setError('Failed to build transaction');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <PageLoadingState message="Loading listing..." />
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-foreground font-medium mb-2">Listing not found</p>
          <Link to="/" className="text-primary hover:underline font-mono text-sm">
            ← Back to marketplace
          </Link>
        </div>
      </Layout>
    );
  }

  const Icon = getMimeIcon(listing.mimeType);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-mono text-sm mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-2">{listing.title}</h1>
                  <div className="flex items-center gap-3 text-sm font-mono">
                    <span className="text-muted-foreground">{listing.mimeType}</span>
                    <span className={listing.isActive ? 'text-primary' : 'text-destructive'}>
                      {listing.isActive ? '● ACTIVE' : '○ INACTIVE'}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
            </div>

            {/* Details Card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground mb-4">Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Seller</span>
                  <span className="font-mono text-sm text-foreground">
                    {listing.seller.slice(0, 12)}...{listing.seller.slice(-8)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Base Price</span>
                  <span className="font-mono text-sm text-foreground">
                    {formatSui(listing.basePrice)} SUI/hour
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Price Slope</span>
                  <span className="font-mono text-sm text-foreground">
                    +{formatSui(listing.priceSlope)} SUI per rental
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Active Rentals</span>
                  <span className="font-mono text-sm text-foreground">{listing.activeRentals}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-mono text-sm text-foreground">
                    {formatSui(listing.totalRevenue)} SUI
                  </span>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Secured by Seal Protocol</h3>
                  <p className="text-sm text-muted-foreground">
                    Content is encrypted with Seal Protocol. Only users with a valid AccessPass NFT can decrypt and view the content. Access is enforced on-chain.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rent Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 sticky top-24">
              <h2 className="font-semibold text-foreground mb-6">Rent Access</h2>

              {/* Duration Selection */}
              <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-3">Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.hours}
                      onClick={() => setSelectedDuration(option.hours)}
                      className={`px-3 py-2 rounded-md border font-mono text-sm transition-colors ${
                        selectedDuration === option.hours
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mb-6 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  <span className="font-mono text-sm text-foreground">
                    {formatSui(listing.basePrice + listing.priceSlope * BigInt(listing.activeRentals))} SUI
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-mono text-sm text-foreground">{selectedDuration} hours</span>
                </div>
                <div className="border-t border-border my-3" />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-mono font-bold text-lg text-primary">
                    {formatSui(calculatedPrice)} SUI
                  </span>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Access granted!</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check your profile to view the content.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              )}

              {/* Rent Button */}
              {account ? (
                <button
                  onClick={handleRent}
                  disabled={isExecuting || !listing.isActive}
                  className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-mono font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4" />
                      Rent Access
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center p-4 rounded-lg border border-border bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to rent access
                  </p>
                </div>
              )}

              {!listing.isActive && (
                <p className="text-center text-sm text-destructive mt-4">
                  This listing is currently inactive
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
