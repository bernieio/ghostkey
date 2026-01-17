import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Layout } from '@/components/Layout';
import { AccessPassCard } from '@/components/AccessPassCard';
import { SkeletonCard, PageLoadingState } from '@/components/LoadingState';
import { useAppStore } from '@/stores/appStore';
import { fetchUserAccessPasses } from '@/lib/sui';
import { Key, User, Wallet } from 'lucide-react';

export default function Profile() {
  const account = useCurrentAccount();
  const { accessPasses, setAccessPasses } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadAccessPasses() {
      if (!account?.address) {
        setAccessPasses([]);
        return;
      }

      setIsLoading(true);
      try {
        const passes = await fetchUserAccessPasses(account.address);
        setAccessPasses(passes);
      } catch (error) {
        console.error('Failed to fetch access passes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAccessPasses();
  }, [account?.address, setAccessPasses]);

  const activePasses = accessPasses.filter(p => p.expiresAt > Date.now());
  const expiredPasses = accessPasses.filter(p => p.expiresAt <= Date.now());

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Profile</h1>
          <p className="text-muted-foreground">
            View and manage your content access
          </p>
        </div>

        {/* Not Connected */}
        {!account && (
          <div className="text-center p-12 rounded-lg border border-border bg-card">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-2">Connect your wallet</p>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view your access passes
            </p>
          </div>
        )}

        {/* Connected */}
        {account && (
          <div className="space-y-8">
            {/* Wallet Info */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <span className="block text-sm text-muted-foreground mb-1">Connected Wallet</span>
                  <span className="font-mono text-foreground">
                    {account.address.slice(0, 12)}...{account.address.slice(-8)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Key className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Active Passes</span>
                </div>
                <span className="text-3xl font-bold text-foreground">{activePasses.length}</span>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Expired</span>
                </div>
                <span className="text-3xl font-bold text-foreground">{expiredPasses.length}</span>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Active Passes */}
            {!isLoading && activePasses.length > 0 && (
              <div>
                <h2 className="font-semibold text-foreground mb-4">Active Access Passes</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {activePasses.map((pass) => (
                    <AccessPassCard key={pass.id} pass={pass} />
                  ))}
                </div>
              </div>
            )}

            {/* Expired Passes */}
            {!isLoading && expiredPasses.length > 0 && (
              <div>
                <h2 className="font-semibold text-foreground mb-4">Expired Access Passes</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {expiredPasses.map((pass) => (
                    <AccessPassCard key={pass.id} pass={pass} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && accessPasses.length === 0 && (
              <div className="text-center p-12 rounded-lg border border-border bg-card">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-2">No access passes yet</p>
                <p className="text-sm text-muted-foreground">
                  Rent access to content from the marketplace to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
