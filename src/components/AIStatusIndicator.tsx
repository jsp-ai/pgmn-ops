import { useState, useEffect } from 'react';
import { openaiService } from '../services/openaiService';

interface AIStatusIndicatorProps {
  reasoning?: string;
  confidence?: number;
  error?: string;
  showDetails?: boolean;
}

export function AIStatusIndicator({ 
  reasoning, 
  confidence, 
  error, 
  showDetails = true 
}: AIStatusIndicatorProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const result = await openaiService.testConnection();
      setIsConnected(result.success);
    };
    
    checkConnection();
  }, []);

  const getStatusColor = () => {
    if (isConnected === null) return 'bg-gray-100 text-gray-600';
    if (error) return 'bg-red-100 text-red-600';
    if (isConnected) return 'bg-green-100 text-green-600';
    return 'bg-yellow-100 text-yellow-600';
  };

  const getStatusIcon = () => {
    if (isConnected === null) return '⏳';
    if (error) return '⚠️';
    if (isConnected) return '🤖';
    return '❌';
  };

  const getStatusText = () => {
    if (isConnected === null) return 'Checking AI connection...';
    if (error) return 'AI processing with fallback';
    if (isConnected) return 'AI-powered calculations';
    return 'AI unavailable - using fallback';
  };

  if (!showDetails && !reasoning && !confidence && !error) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusIcon()} {getStatusText()}
          </span>
          {confidence && (
            <span className="text-sm text-gray-600">
              Confidence: {(confidence * 100).toFixed(1)}%
            </span>
          )}
        </div>
        {(reasoning || error) && (
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
      </div>

      {isExpanded && (reasoning || error) && (
        <div className="mt-3 pt-3 border-t">
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
              <h4 className="font-medium text-yellow-800 mb-1">Notice</h4>
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          )}
          
          {reasoning && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="font-medium text-blue-800 mb-1">AI Reasoning</h4>
              <p className="text-sm text-blue-700">{reasoning}</p>
            </div>
          )}
        </div>
      )}

      {!isConnected && isConnected !== null && (
        <div className="mt-3 pt-3 border-t">
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <h4 className="font-medium text-gray-800 mb-2">Setup Required</h4>
            <p className="text-sm text-gray-600 mb-2">
              To enable AI-powered calculations, set your OpenAI API key:
            </p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              VITE_OPENAI_API_KEY=your_api_key_here
            </code>
            <p className="text-xs text-gray-500 mt-2">
              The system will use traditional calculations as fallback.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 