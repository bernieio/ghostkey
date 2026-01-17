import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export function LoadingState({ message = 'Loading...', submessage }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative">
        <div className="absolute inset-0 blur-md bg-primary/30 animate-pulse" />
        <Loader2 className="relative h-8 w-8 text-primary animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-foreground font-medium">{message}</p>
        {submessage && (
          <p className="text-sm text-muted-foreground mt-1 font-mono">{submessage}</p>
        )}
      </div>
    </div>
  );
}

export function PageLoadingState({ message }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingState message={message} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-md bg-muted" />
        <div className="flex-1">
          <div className="h-3 w-16 bg-muted rounded mb-2" />
          <div className="h-3 w-12 bg-muted rounded" />
        </div>
      </div>
      <div className="h-5 w-3/4 bg-muted rounded mb-2" />
      <div className="h-4 w-full bg-muted rounded mb-1" />
      <div className="h-4 w-2/3 bg-muted rounded mb-4" />
      <div className="flex gap-4">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
    </div>
  );
}
