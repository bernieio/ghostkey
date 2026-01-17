import { Link } from 'react-router-dom';
import { formatSui } from '@/lib/sui';
import type { AccessPass } from '@/lib/types';
import { Key, Clock, ExternalLink } from 'lucide-react';

interface AccessPassCardProps {
  pass: AccessPass;
}

function formatExpiry(expiresAt: number): { text: string; isExpired: boolean } {
  const now = Date.now();
  const expiryMs = expiresAt; // Assuming expiresAt is already in ms
  
  if (expiryMs < now) {
    return { text: 'Expired', isExpired: true };
  }

  const diff = expiryMs - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h remaining`, isExpired: false };
  }
  
  if (hours > 0) {
    return { text: `${hours}h ${minutes}m remaining`, isExpired: false };
  }
  
  return { text: `${minutes}m remaining`, isExpired: false };
}

export function AccessPassCard({ pass }: AccessPassCardProps) {
  const { text: expiryText, isExpired } = formatExpiry(pass.expiresAt);

  return (
    <div className={`relative overflow-hidden rounded-lg border ${
      isExpired ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-md ${
              isExpired ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            }`}>
              <Key className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-mono text-xs text-muted-foreground">
                ACCESS PASS
              </span>
              <span className={`text-xs font-mono ${isExpired ? 'text-destructive' : 'text-primary'}`}>
                {isExpired ? '○ EXPIRED' : '● ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Pass ID */}
        <div className="mb-4">
          <span className="block text-xs text-muted-foreground mb-1">Pass ID</span>
          <span className="font-mono text-sm text-foreground">
            {pass.objectId.slice(0, 12)}...{pass.objectId.slice(-8)}
          </span>
        </div>

        {/* Listing ID */}
        <div className="mb-4">
          <span className="block text-xs text-muted-foreground mb-1">Content</span>
          <span className="font-mono text-sm text-foreground">
            {pass.listingId.slice(0, 12)}...{pass.listingId.slice(-8)}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className={isExpired ? 'text-destructive' : ''}>{expiryText}</span>
          </div>
        </div>

        {/* Action */}
        {!isExpired && (
          <Link
            to={`/viewer/${pass.listingId}/${pass.objectId}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-sm hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View Content
          </Link>
        )}

        {/* Price paid */}
        <div className="mt-4 pt-4 border-t border-border">
          <span className="font-mono text-xs text-muted-foreground">
            Paid: {formatSui(pass.purchasePrice)} SUI
          </span>
        </div>
      </div>
    </div>
  );
}
