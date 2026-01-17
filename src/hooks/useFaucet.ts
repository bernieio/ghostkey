import { useState, useCallback } from 'react';
import { suiClient } from '@/lib/sui';

const FAUCET_URL = 'https://faucet.testnet.sui.io/gas';
const FAUCET_STORAGE_PREFIX = 'ghostkey:fauceted:';

export interface FaucetState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useFaucet() {
  const [state, setState] = useState<FaucetState>({
    isLoading: false,
    error: null,
    success: false,
  });

  // Check if address has been fauceted before (localStorage)
  const hasBeenFauceted = useCallback((address: string): boolean => {
    if (!address) return false;
    const key = `${FAUCET_STORAGE_PREFIX}${address}`;
    return localStorage.getItem(key) === 'true';
  }, []);

  // Mark address as fauceted
  const markAsFauceted = useCallback((address: string): void => {
    if (!address) return;
    const key = `${FAUCET_STORAGE_PREFIX}${address}`;
    localStorage.setItem(key, 'true');
  }, []);

  // Get balance for an address
  const getBalance = useCallback(async (address: string): Promise<bigint> => {
    if (!address) return BigInt(0);
    
    try {
      const balance = await suiClient.getBalance({ owner: address });
      return BigInt(balance.totalBalance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return BigInt(0);
    }
  }, []);

  // Request gas from faucet
  const requestGas = useCallback(async (address: string): Promise<boolean> => {
    if (!address) {
      setState({ isLoading: false, error: 'No address provided', success: false });
      return false;
    }

    setState({ isLoading: true, error: null, success: false });

    try {
      const response = await fetch(FAUCET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FixedAmountRequest: {
            recipient: address,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Faucet request failed: ${response.status} - ${errorText}`);
      }

      // Mark as fauceted after success
      markAsFauceted(address);
      
      setState({ isLoading: false, error: null, success: true });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request gas';
      console.error('Faucet error:', error);
      setState({ isLoading: false, error: errorMessage, success: false });
      return false;
    }
  }, [markAsFauceted]);

  // Auto-faucet for first-time users (only if never fauceted and balance is 0)
  const autoFaucet = useCallback(async (address: string): Promise<boolean> => {
    if (!address) return false;

    // Check if already fauceted
    if (hasBeenFauceted(address)) {
      console.log('Address already fauceted, skipping auto-faucet');
      return false;
    }

    // Check current balance
    const balance = await getBalance(address);
    if (balance > BigInt(0)) {
      console.log('Address has balance, skipping auto-faucet');
      // Mark as fauceted since they have funds
      markAsFauceted(address);
      return false;
    }

    // Request gas
    console.log('Auto-fauceting new wallet:', address);
    return requestGas(address);
  }, [hasBeenFauceted, getBalance, markAsFauceted, requestGas]);

  // Manual faucet (for subsequent use when balance is 0)
  const manualFaucet = useCallback(async (address: string): Promise<boolean> => {
    if (!address) {
      setState({ isLoading: false, error: 'No address provided', success: false });
      return false;
    }

    return requestGas(address);
  }, [requestGas]);

  // Check if manual faucet should be shown
  const shouldShowManualFaucet = useCallback(async (address: string): Promise<boolean> => {
    if (!address) return false;
    
    const balance = await getBalance(address);
    return balance === BigInt(0);
  }, [getBalance]);

  const resetState = useCallback(() => {
    setState({ isLoading: false, error: null, success: false });
  }, []);

  return {
    ...state,
    hasBeenFauceted,
    getBalance,
    autoFaucet,
    manualFaucet,
    shouldShowManualFaucet,
    resetState,
  };
}
