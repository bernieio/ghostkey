import { useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WalletAddressProps {
  /** Show full address instead of truncated */
  showFull?: boolean;
  /** Custom class names */
  className?: string;
  /** Number of characters to show at start (default: 6) */
  startChars?: number;
  /** Number of characters to show at end (default: 4) */
  endChars?: number;
}

/**
 * Wallet address display component with double-click to copy
 */
export function WalletAddress({ 
  showFull = false, 
  className = '',
  startChars = 6,
  endChars = 4
}: WalletAddressProps) {
  const { suiAddress } = useAuthContext();
  const [justCopied, setJustCopied] = useState(false);

  const handleDoubleClick = useCallback(async () => {
    if (!suiAddress) return;
    
    try {
      await navigator.clipboard.writeText(suiAddress);
      setJustCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setJustCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }, [suiAddress]);

  if (!suiAddress) return null;

  const displayAddress = showFull 
    ? suiAddress 
    : `${suiAddress.slice(0, startChars)}…${suiAddress.slice(-endChars)}`;

  return (
    <span
      onDoubleClick={handleDoubleClick}
      title="Double-click to copy"
      className={`cursor-pointer select-none font-mono text-sm transition-colors ${
        justCopied 
          ? 'text-primary' 
          : 'text-muted-foreground hover:text-foreground'
      } ${className}`}
    >
      {displayAddress}
    </span>
  );
}
