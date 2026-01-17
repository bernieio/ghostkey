import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h1 className="text-xl font-bold text-red-400 mb-4">
              Something went wrong
            </h1>
            <div className="bg-gray-900 rounded p-4 mb-4 overflow-auto max-h-48">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </div>
            {this.state.error?.stack && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-400">
                  Stack trace
                </summary>
                <pre className="mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
