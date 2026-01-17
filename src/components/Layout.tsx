import { Link, useLocation } from 'react-router-dom';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import logo from '@/assets/phunhuanbuilder-logo.png';

const navItems = [
  { path: '/', label: 'Marketplace' },
  { path: '/upload', label: 'Upload' },
  { path: '/profile', label: 'Profile' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 blur-md bg-primary/30" />
              <span className="relative font-mono text-xl font-bold text-primary glow-text">
                GhostKey
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 font-mono text-sm transition-colors rounded-md ${
                  location.pathname === item.path
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet Connect */}
          <div className="flex items-center gap-4">
            {account && (
              <span className="hidden sm:block font-mono text-xs text-muted-foreground">
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </span>
            )}
            <ConnectButton 
              connectText="Connect Wallet"
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Phú Nhuận Builder" className="h-8" />
              <span className="font-mono text-sm text-muted-foreground">
                © 2026 Phú Nhuận Builder
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
              <span>Sui Testnet</span>
              <span className="text-primary">•</span>
              <span>Seal Protocol</span>
              <span className="text-primary">•</span>
              <span>Walrus Storage</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
