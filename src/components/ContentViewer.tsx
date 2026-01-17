import { useMemo } from 'react';
import { FileText, Image, Video, Music, File, Download } from 'lucide-react';

interface ContentViewerProps {
  content: Uint8Array;
  mimeType: string;
}

export function ContentViewer({ content, mimeType }: ContentViewerProps) {
  const contentUrl = useMemo(() => {
    const blob = new Blob([content.buffer as ArrayBuffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }, [content, mimeType]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = contentUrl;
    a.download = `ghostkey-content.${mimeType.split('/')[1] || 'bin'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Render based on mime type
  if (mimeType.startsWith('image/')) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-lg overflow-hidden border border-border bg-card">
          <img 
            src={contentUrl} 
            alt="Decrypted content" 
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>
        <DownloadButton onClick={handleDownload} />
      </div>
    );
  }

  if (mimeType.startsWith('video/')) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-lg overflow-hidden border border-border bg-card">
          <video 
            src={contentUrl} 
            controls 
            className="w-full h-auto max-h-[70vh]"
          >
            Your browser does not support video playback.
          </video>
        </div>
        <DownloadButton onClick={handleDownload} />
      </div>
    );
  }

  if (mimeType.startsWith('audio/')) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-8 rounded-lg border border-border bg-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Music className="h-8 w-8" />
          </div>
          <audio src={contentUrl} controls className="flex-1">
            Your browser does not support audio playback.
          </audio>
        </div>
        <DownloadButton onClick={handleDownload} />
      </div>
    );
  }

  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    const textContent = new TextDecoder().decode(content);
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-6 max-h-[70vh] overflow-auto">
          <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-words">
            {textContent}
          </pre>
        </div>
        <DownloadButton onClick={handleDownload} />
      </div>
    );
  }

  // Default: show download option
  return (
    <div className="flex flex-col items-center gap-6 p-12 rounded-lg border border-border bg-card">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <File className="h-10 w-10" />
      </div>
      <div className="text-center">
        <p className="text-foreground font-medium mb-1">Binary Content</p>
        <p className="text-sm text-muted-foreground font-mono">{mimeType}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {(content.length / 1024).toFixed(1)} KB
        </p>
      </div>
      <DownloadButton onClick={handleDownload} />
    </div>
  );
}

function DownloadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-md bg-secondary text-secondary-foreground font-mono text-sm hover:bg-secondary/80 transition-colors"
    >
      <Download className="h-4 w-4" />
      Download File
    </button>
  );
}
