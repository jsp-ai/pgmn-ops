import { useState, useRef } from 'react';
import { Employee, AttendanceParseResult, SlackMessage } from '../../types';
import { SlackAttendanceTextParser } from '../../utils/slackAttendanceParser';
import { ParsePreview } from './ParsePreview';

interface SlackTextParserProps {
  employees: Employee[];
  onDataLoad: (messages: SlackMessage[]) => void;
}

export function SlackTextParser({ employees, onDataLoad }: SlackTextParserProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [slackText, setSlackText] = useState('');
  const [parseResult, setParseResult] = useState<AttendanceParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleSlackText = `start date 6/10/25

El
  9:40 AM
IN

Jigs
  9:41 AM
IN

Ash  [8:27 AM]
OUT - JSP Approved

Dom  [9:18 AM]
In

Jolo
  9:53 AM
in

JL
  10:04 AM
IN

Nandro
  10:29 AM
in`;

  const handleParseText = async () => {
    if (!slackText.trim()) {
      setError('Please enter Slack attendance text');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parser = new SlackAttendanceTextParser(employees);
      const result = parser.parseSlackText(slackText);
      setParseResult(result);
    } catch (err) {
      setError('Error parsing Slack text: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;

    // Convert parsed attendance to SlackMessage format for compatibility
    const messages: SlackMessage[] = parseResult.entries
      .filter(entry => entry.employee_id && entry.check_in_time)
      .map(entry => {
        // Find employee to get slack_user_id
        const employee = employees.find(emp => emp.id === entry.employee_id);
        const checkInTime = new Date(`${parseResult.date} ${entry.check_in_time}`);
        
        return {
          user: employee?.slack_user_id || `unknown_${entry.employee_id}`,
          text: `:in: ${entry.status === 'work_from_home' ? 'WFH' : 'IN'}`,
          ts: (checkInTime.getTime() / 1000).toString(),
          date: parseResult.date
        };
      });

    onDataLoad(messages);
    setParseResult(null);
    setSlackText('');
  };

  const handleCancel = () => {
    setParseResult(null);
    setError(null);
  };

  const loadSampleText = () => {
    setSlackText(sampleSlackText);
    setError(null);
  };

  if (parseResult) {
    return (
      <ParsePreview
        result={parseResult}
        employees={employees}
        onConfirm={handleConfirmImport}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Import from Slack</h3>
        <button
          onClick={loadSampleText}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Load Sample
        </button>
      </div>

      <textarea
        ref={textAreaRef}
        value={slackText}
        onChange={(e) => setSlackText(e.target.value)}
        placeholder={`Paste your Slack attendance text here...

Example format:
start date 6/10/25

Employee Name
  9:45 AM
IN

Another Employee  [8:30 AM]
OUT - JSP Approved

Someone Else
  9:55 AM
ETA 10:15 with team`}
        className="w-full h-64 p-3 border border-gray-300 rounded-md resize-vertical font-mono text-sm"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Active employees: {employees.filter(emp => emp.status === 'active').length}
        </div>
        
        <button
          onClick={handleParseText}
          disabled={isLoading || !slackText.trim()}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isLoading || !slackText.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Parsing...' : 'Parse Attendance'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Supported Status Types</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• <strong>Check-in:</strong> "IN", "in", "In"</div>
          <div>• <strong>Approved Out:</strong> "OUT - JSP Approved", "Approved Leave"</div>
          <div>• <strong>Work from Home:</strong> "WFH", "Work from Home"</div>
          <div>• <strong>ETA Delayed:</strong> "ETA 9:55 with team"</div>
        </div>
      </div>
    </div>
  );
} 