import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { AccessPassCard } from '@/components/AccessPassCard';
import { SkeletonCard } from '@/components/LoadingState';
import { FaucetButton } from '@/components/FaucetButton';
import { useAppStore } from '@/stores/appStore';
import { fetchUserAccessPasses, formatSui } from '@/lib/sui';
import { Key, User, Wallet, Copy, Check, Shield, Coins } from 'lucide-react';

export default function Profile() {
  const { isAuthenticated, suiAddress, suiBalance, userEmail, isLoading: authLoading, refreshBalance } = useAuthContext();
  const { accessPasses, setAccessPasses } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAccessPasses() {
      if (!suiAddress) {
        setAccessPasses([]);
        return;
      }

      setIsLoading(true);
      try {
        const passes = await fetchUserAccessPasses(suiAddress);
        setAccessPasses(passes);
      } catch (error) {
        console.error('Failed to fetch access passes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAccessPasses();
  }, [suiAddress, setAccessPasses]);

  const copyAddress = async () => {
    if (suiAddress) {
      await navigator.clipboard.writeText(suiAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activePasses = accessPasses.filter(p => p.expiresAt > Date.now());
  const expiredPasses = accessPasses.filter(p => p.expiresAt <= Date.now());

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Profile</h1>
          <p className="text-muted-foreground">
            Your zkLogin wallet and content access
          </p>
        </div>

        {!isAuthenticated && (
          <div className="text-center p-12 rounded-lg border border-border bg-card">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-2">Sign in required</p>
            <p className="text-sm text-muted-foreground">
              Sign in with Google to access your profile
            </p>
          </div>
        )}

        {isAuthenticated && (
          <div className="space-y-8">
            {/* Wallet Info */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground mb-6">zkLogin Wallet</h2>
              
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Email</span>
                  </div>
                  <span className="font-mono text-sm text-foreground">
                    {userEmail || 'Not available'}
                  </span>
                </div>

                {/* Sui Address */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Sui Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {authLoading ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : suiAddress ? (
                      <>
                        <span className="font-mono text-sm text-foreground">
                          {suiAddress.slice(0, 12)}...{suiAddress.slice(-8)}
                        </span>
                        <button
                          onClick={copyAddress}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Not provisioned</span>
                    )}
                  </div>
                </div>

                {/* Network */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Network</span>
                  </div>
                  <span className="font-mono text-sm text-primary">Sui Testnet</span>
                </div>

                {/* Balance */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Coins className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Balance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-foreground">
                      {authLoading ? 'Loading...' : `${formatSui(suiBalance)} SUI`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Faucet Section */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Testnet Gas</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Need gas? Request testnet SUI for transactions.
                    </p>
                  </div>
                  <FaucetButton showWhenHasBalance={true} />
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Auto-Provisioned Wallet:</strong> Your Sui address was automatically derived from your Google login using zkLogin. No private keys are stored - your wallet is non-custodial and deterministic.
                </p>
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
