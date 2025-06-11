import { errorService } from '../services/errorService';

// Utility to generate test errors for demonstration
export const generateTestError = (message: string = 'Test error for demonstration') => {
  return errorService.handleError(
    new Error(message),
    'TEST_CONTEXT',
    'error',
    'TEST_ERROR'
  );
};

// Generate the specific error ID we're investigating (for demo)
export const simulateSpecificError = () => {
  // This creates a test error with details that might help identify the real issue
  const testError = new Error('Simulated error matching ID 390c02b5-2633-4826-b7cd-20343b85a73c - this is a test to demonstrate error tracking');
  testError.stack = `Error: Simulated error matching ID 390c02b5-2633-4826-b7cd-20343b85a73c
    at simulateSpecificError (errorTestUtils.ts:12:21)
    at onClick (ErrorInvestigator.tsx:45:15)
    at HTMLButtonElement.callCallback (react-dom.js:12)`;
  
  return errorService.handleError(
    testError,
    'ERROR_INVESTIGATION',
    'critical',
    'SIMULATED_ERROR'
  );
};

// Generate common error scenarios that might occur in the app
export const generateCommonErrors = () => {
  const errors = [];
  
  // Data loading error
  errors.push(errorService.dataLoadError('employees', new Error('Failed to fetch employee data from localStorage')));
  
  // Validation error
  errors.push(errorService.validationError('email', 'Email format is invalid'));
  
  // Network error
  errors.push(errorService.networkError('payroll calculation', new Error('Request timeout after 30 seconds')));
  
  // Storage error
  errors.push(errorService.dataSaveError('payroll data', new Error('LocalStorage quota exceeded')));
  
  return errors;
};

// Clear all test errors
export const clearTestErrors = () => {
  errorService.clearAllErrors();
}; 