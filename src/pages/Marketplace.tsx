import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ListingCard } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/LoadingState';
import { useAppStore } from '@/stores/appStore';
import { fetchAllListings } from '@/lib/sui';
import { Search, Grid, Filter, Zap, Shield } from 'lucide-react';

export default function Marketplace() {
  const { listings, setListings } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState(true);

  useEffect(() => {
    async function loadListings() {
      setIsLoading(true);
      try {
        const data = await fetchAllListings();
        setListings(data);
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadListings();
  }, [setListings]);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = filterActive ? listing.isActive : true;
    return matchesSearch && matchesActive;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-mono text-sm mb-6">
            <Zap className="h-4 w-4" />
            Powered by Seal Protocol & zkLogin
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            <span className="text-gradient">GhostKey</span> Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Decentralized content with time-limited access. Rent encrypted content secured by on-chain access control.
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Seal Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>zkLogin Auth</span>
            </div>
            <div className="flex items-center gap-2">
              <Grid className="h-4 w-4 text-primary" />
              <span>Walrus Storage</span>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
            />
          </div>
          <button
            onClick={() => setFilterActive(!filterActive)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-mono text-sm transition-colors ${
              filterActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter className="h-4 w-4" />
            Active Only
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 flex items-center gap-6 text-sm font-mono text-muted-foreground">
          <span>{filteredListings.length} listings</span>
          <span className="text-primary">•</span>
          <span>{listings.filter(l => l.isActive).length} active</span>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Grid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-2">No listings found</p>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery ? 'Try a different search term' : 'Be the first to upload content!'}
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-medium hover:bg-primary/90 transition-colors"
            >
              Upload Content
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
