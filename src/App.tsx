import '@mysten/dapp-kit/dist/index.css';
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Marketplace from "./pages/Marketplace";
import ListingDetail from "./pages/ListingDetail";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Viewer from "./pages/Viewer";
import NotFound from "./pages/NotFound";

// Configure for Sui Testnet
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
});

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
      <WalletProvider autoConnect>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Marketplace />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/viewer/:listingId/:accessPassId" element={<Viewer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>
);

export default App;
