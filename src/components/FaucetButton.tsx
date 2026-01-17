import { useState, useEffect } from 'react';
import { Coins, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFaucet } from '@/hooks/useFaucet';
import { useAuthContext } from '@/contexts/AuthContext';

interface FaucetButtonProps {
  className?: string;
  showWhenHasBalance?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function FaucetButton({ 
  className = '', 
  showWhenHasBalance = false,
  variant = 'outline',
  size = 'default'
}: FaucetButtonProps) {
  const { suiAddress } = useAuthContext();
  const { isLoading, error, success, manualFaucet, getBalance, resetState } = useFaucet();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isCheckingBalance, setIsCheckingBalance] = useState(true);

  useEffect(() => {
    if (!suiAddress) return;

    const checkBalance = async () => {
      setIsCheckingBalance(true);
      const bal = await getBalance(suiAddress);
      setBalance(bal);
      setIsCheckingBalance(false);
    };

    checkBalance();
  }, [suiAddress, getBalance, success]);

  // Reset state on address change
  useEffect(() => {
    resetState();
  }, [suiAddress, resetState]);

  const handleFaucet = async () => {
    if (!suiAddress) return;
    await manualFaucet(suiAddress);
    // Refresh balance after faucet
    const bal = await getBalance(suiAddress);
    setBalance(bal);
  };

  // Don't show if no address
  if (!suiAddress) return null;

  // Don't show if checking balance
  if (isCheckingBalance) return null;

  // Don't show if has balance (unless explicitly requested)
  if (!showWhenHasBalance && balance > BigInt(0)) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {balance === BigInt(0) && !success && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          You're out of testnet gas
        </p>
      )}
      
      <Button
        variant={variant}
        size={size}
        onClick={handleFaucet}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Requesting gas...
          </>
        ) : success ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            Gas received!
          </>
        ) : (
          <>
            <Coins className="h-4 w-4" />
            Get testnet gas
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
