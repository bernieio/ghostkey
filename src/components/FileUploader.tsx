import { useCallback, useState } from 'react';
import { Upload, X, File, Image, Video, Music, FileText } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  disabled?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.startsWith('text/')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({ onFileSelect, selectedFile, onClear, disabled }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  if (selectedFile) {
    const Icon = getFileIcon(selectedFile.type);
    
    return (
      <div className="relative rounded-lg border border-border bg-card p-6">
        <button
          onClick={onClear}
          disabled={disabled}
          className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground font-mono">
              {selectedFile.type || 'Unknown type'} • {formatFileSize(selectedFile.size)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-4 
        rounded-lg border-2 border-dashed p-12 
        transition-colors cursor-pointer
        ${isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        type="file"
        className="sr-only"
        onChange={handleFileInput}
        disabled={disabled}
      />
      
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
        isDragging ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        <Upload className="h-8 w-8" />
      </div>
      
      <div className="text-center">
        <p className="text-foreground font-medium">
          {isDragging ? 'Drop your file here' : 'Drop file here or click to browse'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          All file types supported • Encrypted with Seal Protocol
        </p>
      </div>
    </label>
  );
}
