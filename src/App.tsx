import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import Marketplace from "./pages/Marketplace";
import ListingDetail from "./pages/ListingDetail";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Viewer from "./pages/Viewer";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

// Public route - no auth required
function PublicRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicRoute><Marketplace /></PublicRoute>} />
      <Route path="/listing/:id" element={<PublicRoute><ListingDetail /></PublicRoute>} />
      <Route path="/auth/*" element={<AuthPage />} />
      
      {/* Protected routes */}
      <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/viewer/:listingId/:accessPassId" element={<ProtectedRoute><Viewer /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Configuration Required</h1>
          <p className="text-muted-foreground mb-4">
            Please set the <code className="px-2 py-1 bg-muted rounded font-mono text-sm">VITE_CLERK_PUBLISHABLE_KEY</code> environment variable to enable authentication.
          </p>
          <p className="text-sm text-muted-foreground">
            Get your publishable key from the Clerk dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
