import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '../services/storageService';
import { errorService } from '../services/errorService';

describe('Refactored Architecture', () => {
  describe('StorageService', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should save and load data correctly', async () => {
      const config = { key: 'test-key', version: 1 };
      const testData = { name: 'test', value: 123 };

      // Save data
      const saveResult = await storageService.save(config, testData);
      expect(saveResult.success).toBe(true);

      // Load data
      const loadResult = await storageService.load(config);
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toEqual(testData);
    });

    it('should create backups before saving', async () => {
      const config = { key: 'test-key', version: 1 };
      const initialData = { name: 'initial' };
      const updatedData = { name: 'updated' };

      // Save initial data
      await storageService.save(config, initialData);
      
      // Save updated data (should create backup)
      await storageService.save(config, updatedData);

      // Check backup exists
      const backup = localStorage.getItem('test-key_backup');
      expect(backup).toBeTruthy();
    });

    it('should handle migration when version changes', async () => {
      const configV1 = { 
        key: 'test-key', 
        version: 1 
      };
      
      const configV2 = { 
        key: 'test-key', 
        version: 2,
        migrations: {
          2: (data: any) => ({ ...data, migrated: true })
        }
      };

      // Save with v1
      await storageService.save(configV1, { name: 'test' });

      // Load with v2 (should trigger migration)
      const result = await storageService.load(configV2);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'test', migrated: true });
    });

    it('should restore from backup on load failure', async () => {
      const config = { key: 'test-key', version: 1 };
      const testData = { name: 'backup-test' };

      // Save data
      await storageService.save(config, testData);
      
      // Corrupt the main data
      localStorage.setItem('test-key', 'invalid-json{');

      // Load should restore from backup
      const result = await storageService.load(config);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
    });
  });

  describe('ErrorService', () => {
    beforeEach(() => {
      // Clear any existing errors
      errorService.clearAllErrors();
    });

    it('should handle and track errors', () => {
      const error = new Error('Test error');
      const appError = errorService.handleError(error, 'TEST_CONTEXT');

      expect(appError.message).toBe('Test error');
      expect(appError.context).toBe('TEST_CONTEXT');
      expect(appError.severity).toBe('error');
      expect(appError.id).toBeTruthy();

      const errors = errorService.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(appError);
    });

    it('should categorize different error types', () => {
      const dataError = errorService.dataLoadError('employees', new Error('Load failed'));
      const validationError = errorService.validationError('email', 'Invalid format');
      const networkError = errorService.networkError('API call', new Error('Network timeout'));

      expect(dataError.code).toBe('DATA_LOAD_ERROR');
      expect(validationError.code).toBe('VALIDATION_ERROR');
      expect(networkError.code).toBe('NETWORK_ERROR');

      expect(validationError.severity).toBe('warning');
      expect(dataError.severity).toBe('error');
    });

    it('should limit error history to 50 entries', () => {
      // Add 60 errors
      for (let i = 0; i < 60; i++) {
        errorService.handleError(`Error ${i}`, 'TEST');
      }

      const errors = errorService.getErrors();
      expect(errors).toHaveLength(50);
      // Should have the last 50 errors
      expect(errors[0].message).toBe('Error 10');
      expect(errors[49].message).toBe('Error 59');
    });

    it('should filter errors by context', () => {
      errorService.handleError('Context A error', 'CONTEXT_A');
      errorService.handleError('Context B error', 'CONTEXT_B');
      errorService.handleError('Another Context A error', 'CONTEXT_A');

      const contextAErrors = errorService.getErrorsByContext('CONTEXT_A');
      expect(contextAErrors).toHaveLength(2);
      expect(contextAErrors.every(e => e.context === 'CONTEXT_A')).toBe(true);
    });

    it('should wrap async operations with error handling', async () => {
      const successOperation = async () => {
        return 'success result';
      };

      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      // Test successful operation
      const successResult = await errorService.withErrorHandling(
        successOperation,
        'SUCCESS_TEST'
      );
      expect(successResult.success).toBe(true);
      expect(successResult.data).toBe('success result');

      // Test failing operation
      const failResult = await errorService.withErrorHandling(
        failingOperation,
        'FAIL_TEST'
      );
      expect(failResult.success).toBe(false);
      expect(failResult.error).toBeTruthy();
      expect(failResult.error?.context).toBe('FAIL_TEST');
    });

    it('should subscribe to error events', () => {
      const errorHandler = vi.fn();
      const unsubscribe = errorService.subscribe(errorHandler);

      errorService.handleError('Test error', 'TEST');
      
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          context: 'TEST'
        })
      );

      // Test unsubscribe
      unsubscribe();
      errorService.handleError('Another error', 'TEST');
      expect(errorHandler).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should clear individual and all errors', () => {
      const error1 = errorService.handleError('Error 1', 'TEST');
      const error2 = errorService.handleError('Error 2', 'TEST');

      expect(errorService.getErrors()).toHaveLength(2);

      // Clear individual error
      errorService.clearError(error1.id);
      expect(errorService.getErrors()).toHaveLength(1);
      expect(errorService.getErrors()[0].id).toBe(error2.id);

      // Clear all errors
      errorService.clearAllErrors();
      expect(errorService.getErrors()).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle storage errors gracefully', async () => {
      const config = { key: 'test-key', version: 1 };
      
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = await storageService.save(config, { test: 'data' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');

      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should log errors appropriately in development', () => {
      const originalEnv = process.env.NODE_ENV;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Set development mode
      process.env.NODE_ENV = 'development';

      errorService.handleError(new Error('Dev error'), 'DEV_TEST', 'critical');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CRITICAL] DEV_TEST: Dev error'),
        expect.any(String)
      );

      // Restore
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });
}); 