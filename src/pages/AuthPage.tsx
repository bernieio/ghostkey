import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Shield, Zap } from 'lucide-react';
import logo from '@/assets/phunhuanbuilder-logo.png';

export default function AuthPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/');
    }
  }, [isLoaded, isSignedIn, navigate]);

  const isSignUp = location.pathname.includes('sign-up');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-border">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <span className="font-mono text-2xl font-bold text-primary glow-text">GhostKey</span>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Decentralized Content
            <br />
            <span className="text-gradient">Marketplace</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-12 max-w-md">
            Encrypt, upload, and monetize your content with time-limited access powered by Seal Protocol and Sui blockchain.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">On-Chain Access Control</h3>
                <p className="text-sm text-muted-foreground">
                  Content access enforced by Sui smart contracts via Seal Protocol
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Auto Wallet Provisioning</h3>
                <p className="text-sm text-muted-foreground">
                  Sign in with Google and get a Sui wallet automatically via zkLogin
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <img src={logo} alt="Phú Nhuận Builder" className="h-8" />
          <span className="font-mono text-sm text-muted-foreground">
            © 2026 Phú Nhuận Builder
          </span>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="font-mono text-2xl font-bold text-primary glow-text">GhostKey</span>
            <p className="text-muted-foreground mt-2">Decentralized Content Marketplace</p>
          </div>

          {isSignUp ? (
            <SignUp 
              routing="path" 
              path="/auth/sign-up"
              signInUrl="/auth/sign-in"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-card border border-border shadow-none',
                  headerTitle: 'text-foreground',
                  headerSubtitle: 'text-muted-foreground',
                  socialButtonsBlockButton: 'bg-secondary text-secondary-foreground border-border hover:bg-muted',
                  formFieldLabel: 'text-foreground',
                  formFieldInput: 'bg-input border-border text-foreground',
                  footerActionLink: 'text-primary hover:text-primary/80',
                  identityPreviewText: 'text-foreground',
                  identityPreviewEditButton: 'text-primary',
                },
              }}
            />
          ) : (
            <SignIn 
              routing="path" 
              path="/auth/sign-in"
              signUpUrl="/auth/sign-up"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-card border border-border shadow-none',
                  headerTitle: 'text-foreground',
                  headerSubtitle: 'text-muted-foreground',
                  socialButtonsBlockButton: 'bg-secondary text-secondary-foreground border-border hover:bg-muted',
                  formFieldLabel: 'text-foreground',
                  formFieldInput: 'bg-input border-border text-foreground',
                  footerActionLink: 'text-primary hover:text-primary/80',
                  identityPreviewText: 'text-foreground',
                  identityPreviewEditButton: 'text-primary',
                },
              }}
            />
          )}

          <p className="text-center text-xs text-muted-foreground mt-8">
            By signing in, a Sui wallet will be automatically provisioned for you via zkLogin.
            <br />
            No wallet extension required.
          </p>
        </div>
      </div>
    </div>
  );
}
