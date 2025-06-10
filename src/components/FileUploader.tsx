import React, { useRef, useState } from 'react';
import { SlackMessage } from '../types';

interface FileUploaderProps {
  onDataLoad: (messages: SlackMessage[]) => void;
}

export function FileUploader({ onDataLoad }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');

  const handleFileRead = (content: string) => {
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        onDataLoad(data);
      } else {
        alert('Invalid JSON format. Expected an array of messages.');
      }
    } catch (error) {
      alert('Error parsing JSON: ' + (error as Error).message);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleFileRead(content);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleFileRead(content);
      };
      reader.readAsText(file);
    }
  };

  const handleTextSubmit = () => {
    const content = textAreaRef.current?.value;
    if (content) {
      handleFileRead(content);
    }
  };

  const loadSampleData = async () => {
    // Import sample data directly instead of fetching
    try {
      const sampleData = await import('../data/slack-sample.json');
      onDataLoad(sampleData.default);
    } catch (error) {
      // Fallback to inline sample data if import fails
      const sampleData: SlackMessage[] = [
        {
          user: "U01234567",
          text: ":in: Good morning team!",
          ts: "1704088800.000100",
          date: "2024-01-01"
        },
        {
          user: "U01234567", 
          text: ":out: Heading home, see you tomorrow!",
          ts: "1704117600.000100",
          date: "2024-01-01"
        },
        {
          user: "U01234568",
          text: ":in: Morning everyone!",
          ts: "1704089100.000200",
          date: "2024-01-01"
        },
        {
          user: "U01234568",
          text: ":out: Done for the day!",
          ts: "1704121200.000200",
          date: "2024-01-01"
        },
        {
          user: "U01234569",
          text: ":in: Sorry I'm late, traffic was terrible!",
          ts: "1704092400.000300",
          date: "2024-01-01"
        },
        {
          user: "U01234569",
          text: ":out: Leaving now",
          ts: "1704124800.000300",
          date: "2024-01-01"
        }
      ];
      onDataLoad(sampleData);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Import Attendance Data</h2>
      
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setUploadMode('file')}
          className={`px-4 py-2 rounded ${
            uploadMode === 'file' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setUploadMode('text')}
          className={`px-4 py-2 rounded ${
            uploadMode === 'text' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Paste JSON
        </button>
        <button
          onClick={loadSampleData}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Load Sample Data
        </button>
      </div>

      {uploadMode === 'file' ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="space-y-2">
            <div className="text-gray-600">
              Drag and drop a JSON file here, or click to select
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Choose File
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            ref={textAreaRef}
            placeholder="Paste your Slack attendance JSON data here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-md resize-vertical"
          />
          <button
            onClick={handleTextSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Process JSON
          </button>
        </div>
      )}
    </div>
  );
} 