import React, { useState, useEffect } from 'react';
import { errorService, ERROR_STORAGE_KEY, AppError } from '../services/errorService';
import { generateTestError, simulateSpecificError, generateCommonErrors, clearTestErrors } from '../utils/errorTestUtils';

interface ErrorInvestigatorProps {
  errorId?: string;
}

export const ErrorInvestigator: React.FC<ErrorInvestigatorProps> = ({ errorId }) => {
  const [searchId, setSearchId] = useState(errorId || '');
  const [foundError, setFoundError] = useState<AppError | null>(null);
  const [allErrors, setAllErrors] = useState<AppError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [persistedErrors, setPersistedErrors] = useState<any>(null);

  useEffect(() => {
    loadAllErrors();
  }, []);

  const loadAllErrors = () => {
    setIsLoading(true);
    
    // Get current errors from service
    const currentErrors = errorService.getErrors();
    setAllErrors(currentErrors);

    // Try to load persisted errors from localStorage
    try {
      const stored = localStorage.getItem(ERROR_STORAGE_KEY);
      if (stored) {
        const errorData = JSON.parse(stored);
        setPersistedErrors(errorData);
      }
    } catch (error) {
      console.warn('Failed to load persisted errors:', error);
    }

    setIsLoading(false);
  };

  const searchForError = () => {
    if (!searchId.trim()) return;

    // Search in current errors
    const currentError = errorService.findErrorById(searchId.trim());
    if (currentError) {
      setFoundError(currentError);
      return;
    }

    // Search in persisted errors
    if (persistedErrors?.errors) {
      const persistedError = persistedErrors.errors.find(
        (error: any) => error.id === searchId.trim()
      );
      if (persistedError) {
        setFoundError({
          ...persistedError,
          timestamp: new Date(persistedError.timestamp)
        });
        return;
      }
    }

    setFoundError(null);
  };

  const getContextualErrors = (context?: string) => {
    if (!context) return [];
    return allErrors.filter(error => error.context === context);
  };

  const exportErrorData = () => {
    const errorData = {
      searchId,
      foundError,
      allCurrentErrors: allErrors,
      persistedErrorData: persistedErrors,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(errorData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-investigation-${searchId || 'all'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Error Investigator</h2>
      
      {/* Search Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Error ID
        </label>
        <div className="flex space-x-3">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="390c02b5-2633-4826-b7cd-20343b85a73c"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={searchForError}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Search
          </button>
          <button
            onClick={loadAllErrors}
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Found Error Details */}
      {foundError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-3">
            🚨 Error Found: {foundError.id}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong className="text-red-700">Message:</strong>
              <p className="text-red-600 mt-1">{foundError.message}</p>
            </div>
            
            <div>
              <strong className="text-red-700">Context:</strong>
              <p className="text-red-600 mt-1">{foundError.context || 'Unknown'}</p>
            </div>
            
            <div>
              <strong className="text-red-700">Code:</strong>
              <p className="text-red-600 mt-1">{foundError.code}</p>
            </div>
            
            <div>
              <strong className="text-red-700">Severity:</strong>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                foundError.severity === 'critical' ? 'bg-red-100 text-red-800' :
                foundError.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                foundError.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {foundError.severity.toUpperCase()}
              </span>
            </div>
            
            <div>
              <strong className="text-red-700">Timestamp:</strong>
              <p className="text-red-600 mt-1">{foundError.timestamp.toLocaleString()}</p>
            </div>
          </div>

          {foundError.details && (
            <div className="mt-4">
              <strong className="text-red-700">Stack Trace:</strong>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40 text-gray-800">
                {foundError.details}
              </pre>
            </div>
          )}

          {/* Related Errors */}
          {foundError.context && getContextualErrors(foundError.context).length > 1 && (
            <div className="mt-4">
              <strong className="text-red-700">Related Errors in same context:</strong>
              <div className="mt-2 space-y-1">
                {getContextualErrors(foundError.context)
                  .filter(e => e.id !== foundError.id)
                  .slice(0, 3)
                  .map(error => (
                    <div key={error.id} className="text-sm text-red-600">
                      • {error.message} ({error.timestamp.toLocaleString()})
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Error Found */}
      {searchId && !foundError && !isLoading && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">
            ⚠️ Error ID Not Found
          </h3>
          <p className="text-yellow-700 mt-2">
            The error ID "{searchId}" was not found in current or persisted errors.
            This could mean:
          </p>
          <ul className="mt-2 text-yellow-700 list-disc list-inside">
            <li>The error occurred before error persistence was implemented</li>
            <li>The error was cleared or exceeded the 50-error limit</li>
            <li>The error ID was typed incorrectly</li>
            <li>Local storage was cleared</li>
          </ul>
        </div>
      )}

      {/* Current Errors Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          📊 Current Error Summary ({allErrors.length} errors)
        </h3>
        
        {allErrors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Context</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allErrors.slice(0, 10).map((error) => (
                  <tr key={error.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {error.timestamp.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        error.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        error.severity === 'error' ? 'bg-orange-100 text-orange-800' :
                        error.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {error.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{error.context || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                      {error.message}
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-gray-500">
                      {error.id.substring(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allErrors.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 10 of {allErrors.length} errors
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No current errors found.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={exportErrorData}
          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
        >
          📄 Export Error Data
        </button>
        
        <button
          onClick={() => {
            if (confirm('Clear all errors? This cannot be undone.')) {
              errorService.clearAllErrors();
              loadAllErrors();
              setFoundError(null);
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
        >
          🗑️ Clear All Errors
        </button>
      </div>

      {/* Test Error Generation */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          🧪 Test Error Generation
        </h3>
        <p className="text-yellow-700 text-sm mb-3">
          Since error ID "390c02b5-2633-4826-b7cd-20343b85a73c" may not be in current storage, 
          you can generate test errors to demonstrate the system:
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              generateTestError();
              loadAllErrors();
            }}
            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
          >
            Generate Test Error
          </button>
          
          <button
            onClick={() => {
              simulateSpecificError();
              loadAllErrors();
            }}
            className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
          >
            Simulate Target Error
          </button>
          
          <button
            onClick={() => {
              generateCommonErrors();
              loadAllErrors();
            }}
            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
          >
            Generate Common Errors
          </button>

          <button
            onClick={() => {
              clearTestErrors();
              loadAllErrors();
              setFoundError(null);
            }}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Clear Test Errors
          </button>
        </div>
      </div>

      {/* Debug Info */}
      {persistedErrors && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            🔧 Debug Info (Persisted Data)
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
            {JSON.stringify(persistedErrors, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}; 