import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  initializeZkLogin, 
  getZkLoginState, 
  clearZkLoginState,
  isZkLoginInitialized,
  type ZkLoginState 
} from '@/lib/zklogin';
import { suiClient } from '@/lib/sui';

const FAUCET_URL = 'https://faucet.testnet.sui.io/gas';
const FAUCET_STORAGE_PREFIX = 'ghostkey:fauceted:';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAutoFauceting: boolean;
  userId: string | null;
  userEmail: string | null;
  suiAddress: string | null;
  suiBalance: bigint;
  zkLoginState: Partial<ZkLoginState>;
  signOut: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, signOut: clerkSignOut, getToken } = useAuth();
  const { user } = useUser();
  
  const [suiAddress, setSuiAddress] = useState<string | null>(null);
  const [suiBalance, setSuiBalance] = useState<bigint>(BigInt(0));
  const [zkLoginState, setZkLoginState] = useState<Partial<ZkLoginState>>({});
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAutoFauceting, setIsAutoFauceting] = useState(false);

  // Check if address has been fauceted
  const hasBeenFauceted = useCallback((address: string): boolean => {
    const key = `${FAUCET_STORAGE_PREFIX}${address}`;
    return localStorage.getItem(key) === 'true';
  }, []);

  // Mark address as fauceted
  const markAsFauceted = useCallback((address: string): void => {
    const key = `${FAUCET_STORAGE_PREFIX}${address}`;
    localStorage.setItem(key, 'true');
  }, []);

  // Get balance
  const getBalance = useCallback(async (address: string): Promise<bigint> => {
    try {
      const balance = await suiClient.getBalance({ owner: address });
      return BigInt(balance.totalBalance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return BigInt(0);
    }
  }, []);

  // Request faucet
  const requestFaucet = useCallback(async (address: string): Promise<boolean> => {
    try {
      const response = await fetch(FAUCET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FixedAmountRequest: { recipient: address },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Faucet failed: ${response.status}`);
      }
      
      markAsFauceted(address);
      return true;
    } catch (error) {
      console.error('Faucet error:', error);
      return false;
    }
  }, [markAsFauceted]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!suiAddress) return;
    const balance = await getBalance(suiAddress);
    setSuiBalance(balance);
  }, [suiAddress, getBalance]);

  // Initialize zkLogin when user signs in
  useEffect(() => {
    async function initWallet() {
      if (!isLoaded || !isSignedIn || !user?.id) {
        setSuiAddress(null);
        setZkLoginState({});
        setSuiBalance(BigInt(0));
        return;
      }

      // Check if already initialized
      if (isZkLoginInitialized()) {
        const state = getZkLoginState();
        const address = state.address || null;
        setSuiAddress(address);
        setZkLoginState(state);
        
        // Get balance for existing wallet
        if (address) {
          const balance = await getBalance(address);
          setSuiBalance(balance);
        }
        return;
      }

      setIsInitializing(true);
      
      try {
        // Get JWT token from Clerk
        const jwt = await getToken();
        
        if (jwt) {
          const { address, isNewWallet } = await initializeZkLogin(user.id, jwt);
          
          setSuiAddress(address);
          setZkLoginState(getZkLoginState());
          
          // Get balance
          const balance = await getBalance(address);
          setSuiBalance(balance);
          
          // Auto-faucet for new wallets with zero balance
          if (isNewWallet || (!hasBeenFauceted(address) && balance === BigInt(0))) {
            console.log('Auto-fauceting new wallet:', address);
            setIsAutoFauceting(true);
            
            const success = await requestFaucet(address);
            
            if (success) {
              // Refresh balance after faucet
              const newBalance = await getBalance(address);
              setSuiBalance(newBalance);
              console.log('Auto-faucet successful, new balance:', newBalance.toString());
            }
            
            setIsAutoFauceting(false);
          } else if (balance > BigInt(0) && !hasBeenFauceted(address)) {
            // Mark as fauceted if they already have funds
            markAsFauceted(address);
          }
        }
      } catch (error) {
        console.error('Failed to initialize zkLogin:', error);
        setIsAutoFauceting(false);
      } finally {
        setIsInitializing(false);
      }
    }

    initWallet();
  }, [isLoaded, isSignedIn, user?.id, getToken, getBalance, hasBeenFauceted, markAsFauceted, requestFaucet]);

  const handleSignOut = async () => {
    clearZkLoginState();
    setSuiAddress(null);
    setZkLoginState({});
    setSuiBalance(BigInt(0));
    await clerkSignOut();
  };

  const refreshWallet = async () => {
    if (!user?.id) return;
    
    const jwt = await getToken();
    if (jwt) {
      const { address } = await initializeZkLogin(user.id, jwt);
      setSuiAddress(address);
      setZkLoginState(getZkLoginState());
      
      const balance = await getBalance(address);
      setSuiBalance(balance);
    }
  };

  const value: AuthContextValue = {
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded || isInitializing,
    isAutoFauceting,
    userId: user?.id || null,
    userEmail: user?.primaryEmailAddress?.emailAddress || null,
    suiAddress,
    suiBalance,
    zkLoginState,
    signOut: handleSignOut,
    refreshWallet,
    refreshBalance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
