import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ContentViewer } from '@/components/ContentViewer';
import { fetchListing } from '@/lib/sui';
import { downloadFromWalrus } from '@/lib/walrus';
import { decryptWithSeal } from '@/lib/seal';
import type { Listing } from '@/lib/types';
import { 
  ArrowLeft, 
  Shield, 
  Loader2, 
  AlertCircle,
  Lock,
  Unlock
} from 'lucide-react';

type ViewerStep = 'loading' | 'downloading' | 'decrypting' | 'ready' | 'error';

export default function Viewer() {
  const { listingId, accessPassId } = useParams<{ listingId: string; accessPassId: string }>();
  const { isAuthenticated, suiAddress } = useAuthContext();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [step, setStep] = useState<ViewerStep>('loading');
  const [error, setError] = useState<string | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<Uint8Array | null>(null);

  useEffect(() => {
    async function loadAndDecrypt() {
      if (!listingId || !accessPassId || !isAuthenticated) return;

      setError(null);

      try {
        // Step 1: Load listing info
        setStep('loading');
        const listingData = await fetchListing(listingId);
        
        if (!listingData) {
          throw new Error('Listing not found');
        }
        
        setListing(listingData);

        // Step 2: Download encrypted blob
        setStep('downloading');
        const encryptedBlob = await downloadFromWalrus(listingData.blobId);

        // Step 3: Decrypt with Seal
        setStep('decrypting');
        const { content } = await decryptWithSeal(encryptedBlob, accessPassId);

        setDecryptedContent(content);
        setStep('ready');
      } catch (err) {
        console.error('Failed to load content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
        setStep('error');
      }
    }

    loadAndDecrypt();
  }, [listingId, accessPassId, isAuthenticated]);

  // Not connected
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-2">Sign in required</p>
          <p className="text-sm text-muted-foreground mb-6">
            You need to sign in to view content
          </p>
          <Link
            to="/auth/sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Link */}
        <Link 
          to="/profile" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-mono text-sm mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        {/* Header */}
        {listing && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">{listing.title}</h1>
            <p className="text-muted-foreground">{listing.description}</p>
          </div>
        )}

        {/* Loading States */}
        {(step === 'loading' || step === 'downloading' || step === 'decrypting') && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="absolute inset-0 blur-lg bg-primary/30 animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-card border border-primary/50">
                {step === 'decrypting' ? (
                  <Unlock className="h-8 w-8 text-primary animate-pulse" />
                ) : (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                )}
              </div>
            </div>
            <p className="text-foreground font-medium mb-1">
              {step === 'loading' && 'Loading listing...'}
              {step === 'downloading' && 'Downloading encrypted content...'}
              {step === 'decrypting' && 'Decrypting with Seal Protocol...'}
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              {step === 'downloading' && 'Fetching from Walrus'}
              {step === 'decrypting' && 'Verifying AccessPass on-chain'}
            </p>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-foreground font-medium mb-2">Failed to load content</p>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-medium hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Content Ready */}
        {step === 'ready' && decryptedContent && listing && (
          <div className="space-y-6 animate-fade-in">
            {/* Security Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-mono text-sm">
              <Shield className="h-4 w-4" />
              Decrypted with Seal Protocol
            </div>

            {/* Content */}
            <ContentViewer content={decryptedContent} mimeType={listing.mimeType} />
          </div>
        )}
      </div>
    </Layout>
  );
}
