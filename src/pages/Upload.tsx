import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { FileUploader } from '@/components/FileUploader';
import { generateSealId, encryptWithSeal } from '@/lib/seal';
import { useWalrusUpload } from '@/hooks/useWalrus';
import { suiToMist } from '@/lib/sui';
import { 
  Upload as UploadIcon, 
  Shield, 
  HardDrive, 
  Link as LinkIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lock
} from 'lucide-react';

type Step = 'select' | 'details' | 'encrypting' | 'uploading' | 'listing' | 'complete' | 'error';

export default function Upload() {
  const navigate = useNavigate();
  const { isAuthenticated, suiAddress } = useAuthContext();
  const { upload: walrusUpload, isUploading: isWalrusUploading } = useWalrusUpload();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('0.1');
  const [priceSlope, setPriceSlope] = useState('0.01');
  const [step, setStep] = useState<Step>('select');
  const [error, setError] = useState<string | null>(null);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [sealId, setSealId] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setStep('details');
    setError(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setStep('select');
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || !isAuthenticated || !suiAddress) return;

    setError(null);

    try {
      // Step 1: Generate Seal ID
      setStep('encrypting');
      const generatedSealId = generateSealId();
      setSealId(generatedSealId);
      
      // Read file content
      const arrayBuffer = await file.arrayBuffer();
      const content = new Uint8Array(arrayBuffer);
      
      // Encrypt with Seal
      const encryptedContent = await encryptWithSeal(content, generatedSealId);
      
      // Step 2: Upload to Walrus using SDK (no CORS issues)
      setStep('uploading');
      const generatedBlobId = await walrusUpload(encryptedContent);
      setBlobId(generatedBlobId);
      
      // Step 3: Create listing on-chain (requires zkLogin transaction)
      setStep('listing');
      
      // Note: Full zkLogin transaction signing requires ZK proof generation
      // For MVP, we show that encryption and upload work but can't complete the listing
      setError(
        'Content encrypted and uploaded to Walrus successfully! ' +
        'On-chain listing creation requires full zkLogin implementation with ZK proofs. ' +
        `Blob ID: ${generatedBlobId.slice(0, 16)}...`
      );
      setStep('error');
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('error');
    }
  };

  const isProcessing = step === 'encrypting' || step === 'uploading' || step === 'listing';

  const StepIndicator = ({ currentStep, label, icon: Icon }: { currentStep: Step; label: string; icon: React.ElementType }) => {
    const steps: Step[] = ['select', 'details', 'encrypting', 'uploading', 'listing', 'complete'];
    const currentIndex = steps.indexOf(step);
    const stepIndex = steps.indexOf(currentStep);
    const isActive = stepIndex <= currentIndex;
    const isCurrent = currentStep === step;

    return (
      <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${
          isCurrent ? 'border-primary bg-primary text-primary-foreground' :
          isActive ? 'border-primary bg-primary/10' : 'border-muted'
        }`}>
          {isCurrent && isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive && stepIndex < currentIndex ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
        <span className="font-mono text-sm hidden sm:block">{label}</span>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Upload Content</h1>
          <p className="text-muted-foreground">
            Encrypt your content with Seal Protocol and list it on the marketplace
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <StepIndicator currentStep="select" label="Select" icon={UploadIcon} />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <StepIndicator currentStep="encrypting" label="Encrypt" icon={Shield} />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <StepIndicator currentStep="uploading" label="Upload" icon={HardDrive} />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <StepIndicator currentStep="listing" label="List" icon={LinkIcon} />
        </div>

        {/* Not Authenticated */}
        {!isAuthenticated && (
          <div className="text-center p-12 rounded-lg border border-border bg-card">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-2">Sign in required</p>
            <p className="text-sm text-muted-foreground mb-6">
              You need to sign in to upload content
            </p>
            <Link
              to="/auth/sign-in"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-medium hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Main Form */}
        {isAuthenticated && step !== 'complete' && (
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content File
              </label>
              <FileUploader
                onFileSelect={handleFileSelect}
                selectedFile={file}
                onClear={handleClearFile}
                disabled={isProcessing}
              />
            </div>

            {/* Details Form */}
            {file && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title for your content"
                    disabled={isProcessing}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your content"
                    rows={3}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Base Price (SUI/hour)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Price Slope (SUI/rental)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={priceSlope}
                      onChange={(e) => setPriceSlope(e.target.value)}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Error / Status */}
                {error && (
                  <div className="p-4 rounded-lg bg-muted border border-border">
                    <div className="flex items-center gap-2 text-foreground mb-1">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Status</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleUpload}
                  disabled={!title || !description || isProcessing}
                  className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-mono font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {step === 'encrypting' && 'Encrypting...'}
                      {step === 'uploading' && 'Uploading to Walrus...'}
                      {step === 'listing' && 'Creating listing...'}
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Encrypt & Upload
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success */}
        {step === 'complete' && (
          <div className="text-center p-12 rounded-lg border border-primary/30 bg-primary/5 animate-fade-in">
            <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Listing Created!</h2>
            <p className="text-muted-foreground mb-6">
              Your content has been encrypted and uploaded to Walrus. The listing is now live on the marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-mono font-medium hover:bg-primary/90 transition-colors"
              >
                View Marketplace
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setTitle('');
                  setDescription('');
                  setStep('select');
                  setError(null);
                }}
                className="px-6 py-3 rounded-lg border border-border bg-card text-foreground font-mono hover:bg-muted transition-colors"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
