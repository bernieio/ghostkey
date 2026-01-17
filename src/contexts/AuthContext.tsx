import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  initializeZkLogin, 
  getZkLoginState, 
  clearZkLoginState,
  isZkLoginInitialized,
  type ZkLoginState 
} from '@/lib/zklogin';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userEmail: string | null;
  suiAddress: string | null;
  zkLoginState: Partial<ZkLoginState>;
  signOut: () => Promise<void>;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, signOut: clerkSignOut, getToken } = useAuth();
  const { user } = useUser();
  
  const [suiAddress, setSuiAddress] = useState<string | null>(null);
  const [zkLoginState, setZkLoginState] = useState<Partial<ZkLoginState>>({});
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize zkLogin when user signs in
  useEffect(() => {
    async function initWallet() {
      if (!isLoaded || !isSignedIn || !user?.id) {
        setSuiAddress(null);
        setZkLoginState({});
        return;
      }

      // Check if already initialized
      if (isZkLoginInitialized()) {
        const state = getZkLoginState();
        setSuiAddress(state.address || null);
        setZkLoginState(state);
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
          
          if (isNewWallet) {
            console.log('New zkLogin wallet provisioned:', address);
          }
        }
      } catch (error) {
        console.error('Failed to initialize zkLogin:', error);
      } finally {
        setIsInitializing(false);
      }
    }

    initWallet();
  }, [isLoaded, isSignedIn, user?.id, getToken]);

  const handleSignOut = async () => {
    clearZkLoginState();
    setSuiAddress(null);
    setZkLoginState({});
    await clerkSignOut();
  };

  const refreshWallet = async () => {
    if (!user?.id) return;
    
    const jwt = await getToken();
    if (jwt) {
      const { address } = await initializeZkLogin(user.id, jwt);
      setSuiAddress(address);
      setZkLoginState(getZkLoginState());
    }
  };

  const value: AuthContextValue = {
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded || isInitializing,
    userId: user?.id || null,
    userEmail: user?.primaryEmailAddress?.emailAddress || null,
    suiAddress,
    zkLoginState,
    signOut: handleSignOut,
    refreshWallet,
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
