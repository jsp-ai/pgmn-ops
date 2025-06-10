import React, { Component, ReactNode } from 'react';
import { errorService } from '../services/errorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to service
    const appError = errorService.handleError(
      error,
      'REACT_ERROR_BOUNDARY',
      'critical',
      'REACT_ERROR'
    );

    this.setState({ errorId: appError.id });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log additional debug info in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    });
  };

  handleReportError = () => {
    if (this.state.errorId) {
      // In a real app, this would send to error reporting service
      navigator.clipboard.writeText(this.state.errorId).then(() => {
        alert(`Error ID copied to clipboard: ${this.state.errorId}`);
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.697-.833-2.464 0L3.349 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Application Error
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Something went wrong while loading this section of the application.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-3">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Show error details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <p className="text-xs text-gray-500">
                Error ID: <code className="bg-gray-100 px-1 rounded">{this.state.errorId}</code>
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReportError}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Copy Error ID
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => window.location.reload()}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Reload the entire application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 