import { Loader2, Wallet } from 'lucide-react';

interface AutoFaucetOverlayProps {
  isInitializing: boolean;
  isFunding: boolean;
}

export function AutoFaucetOverlay({ isInitializing, isFunding }: AutoFaucetOverlayProps) {
  if (!isInitializing && !isFunding) return null;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4 p-8 rounded-lg border border-border bg-card max-w-sm mx-4">
        <div className="flex justify-center">
          <div className="relative">
            <Wallet className="h-12 w-12 text-primary" />
            <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            {isInitializing ? 'Initializing your wallet…' : 'Funding testnet gas…'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isInitializing 
              ? 'Deriving your Sui address from your login credentials.'
              : 'Requesting testnet SUI so you can start using GhostKey.'
            }
          </p>
        </div>
        
        <div className="flex justify-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
