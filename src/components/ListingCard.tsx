import { Link } from 'react-router-dom';
import { formatSui } from '@/lib/sui';
import type { Listing } from '@/lib/types';
import { FileText, Image, Video, Music, File, Users, Coins } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.startsWith('text/')) return FileText;
  return File;
}

function getMimeLabel(mimeType: string): string {
  const [type, subtype] = mimeType.split('/');
  return subtype?.toUpperCase() || type?.toUpperCase() || 'FILE';
}

export function ListingCard({ listing }: ListingCardProps) {
  const Icon = getMimeIcon(listing.mimeType);

  return (
    <Link 
      to={`/listing/${listing.objectId}`}
      className="group relative block overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      </div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-mono text-xs text-muted-foreground">
                {getMimeLabel(listing.mimeType)}
              </span>
              <span className={`text-xs font-mono ${listing.isActive ? 'text-primary' : 'text-destructive'}`}>
                {listing.isActive ? '● ACTIVE' : '○ INACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {listing.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            <span>{formatSui(listing.basePrice)} SUI/hr</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{listing.activeRentals} active</span>
          </div>
        </div>

        {/* Seller */}
        <div className="mt-4 pt-4 border-t border-border">
          <span className="font-mono text-xs text-muted-foreground">
            by {listing.seller.slice(0, 8)}...{listing.seller.slice(-6)}
          </span>
        </div>
      </div>
    </Link>
  );
}
