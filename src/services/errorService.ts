export interface AppError {
  id: string;
  message: string;
  code: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: Date;
  details?: any;
  context?: string;
}

export interface ErrorState {
  errors: AppError[];
  isLoading: boolean;
}

type ErrorHandler = (error: AppError) => void;

class ErrorService {
  private static instance: ErrorService;
  private handlers: ErrorHandler[] = [];
  private errors: AppError[] = [];

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  subscribe(handler: ErrorHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  handleError(
    error: Error | string,
    context?: string,
    severity: AppError['severity'] = 'error',
    code?: string
  ): AppError {
    const appError: AppError = {
      id: crypto.randomUUID(),
      message: error instanceof Error ? error.message : error,
      code: code || 'UNKNOWN_ERROR',
      severity,
      timestamp: new Date(),
      details: error instanceof Error ? error.stack : undefined,
      context
    };

    this.errors.push(appError);
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = severity === 'critical' || severity === 'error' ? 'error' : 'warn';
      console[logMethod](`[${severity.toUpperCase()}] ${context || 'Unknown'}: ${appError.message}`, appError.details);
    }

    // Notify subscribers
    this.handlers.forEach(handler => handler(appError));

    return appError;
  }

  // Specific error types for common scenarios
  dataLoadError(operation: string, error: Error): AppError {
    return this.handleError(
      `Failed to load ${operation}: ${error.message}`,
      'DATA_LOAD',
      'error',
      'DATA_LOAD_ERROR'
    );
  }

  dataSaveError(operation: string, error: Error): AppError {
    return this.handleError(
      `Failed to save ${operation}: ${error.message}`,
      'DATA_SAVE',
      'error',
      'DATA_SAVE_ERROR'
    );
  }

  validationError(field: string, message: string): AppError {
    return this.handleError(
      `Validation failed for ${field}: ${message}`,
      'VALIDATION',
      'warning',
      'VALIDATION_ERROR'
    );
  }

  networkError(operation: string, error: Error): AppError {
    return this.handleError(
      `Network error during ${operation}: ${error.message}`,
      'NETWORK',
      'error',
      'NETWORK_ERROR'
    );
  }

  clearError(id: string): void {
    this.errors = this.errors.filter(error => error.id !== id);
  }

  clearAllErrors(): void {
    this.errors = [];
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  getErrorsByContext(context: string): AppError[] {
    return this.errors.filter(error => error.context === context);
  }

  // Helper to wrap async operations with error handling
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
    errorMessage?: string
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const appError = this.handleError(
        errorMessage || (error instanceof Error ? error.message : 'Unknown error'),
        context,
        'error'
      );
      return { success: false, error: appError };
    }
  }
}

export const errorService = ErrorService.getInstance(); 