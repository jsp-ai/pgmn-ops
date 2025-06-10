
import { AttendanceParseResult, ParsedAttendanceEntry } from '../../types';

interface ParsePreviewProps {
  result: AttendanceParseResult;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ParsePreview({ result, onConfirm, onCancel, isLoading = false }: ParsePreviewProps) {
  const getStatusBadge = (status: ParsedAttendanceEntry['status']) => {
    const statusConfig = {
      check_in: { color: 'bg-green-100 text-green-800', label: 'Check In' },
      approved_out: { color: 'bg-blue-100 text-blue-800', label: 'Approved Out' },
      work_from_home: { color: 'bg-purple-100 text-purple-800', label: 'WFH' },
      eta_delayed: { color: 'bg-yellow-100 text-yellow-800', label: 'ETA Delayed' },
      no_show: { color: 'bg-red-100 text-red-800', label: 'No Show' },
      unknown: { color: 'bg-gray-100 text-gray-800', label: 'Unknown' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getLateBadge = (isLate: boolean, minutesLate: number) => {
    if (!isLate) return null;
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Late {minutesLate}min
      </span>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Attendance Parsing Preview</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{result.summary.check_ins}</div>
          <div className="text-sm text-green-700">Check-ins</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{result.summary.late_arrivals}</div>
          <div className="text-sm text-yellow-700">Late Arrivals</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{result.summary.no_shows}</div>
          <div className="text-sm text-red-700">No Shows</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{result.summary.unmatched}</div>
          <div className="text-sm text-gray-700">Unmatched</div>
        </div>
      </div>

      {/* Errors and Warnings */}
      {(result.parsing_errors.length > 0 || result.unmatched_names.length > 0) && (
        <div className="mb-6">
          {result.parsing_errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-800 mb-2">Parsing Errors</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {result.parsing_errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {result.unmatched_names.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Unmatched Names</h4>
              <div className="text-sm text-yellow-700">
                Could not match: {result.unmatched_names.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Entries Table */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-in Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lateness
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Match Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {result.entries.map((entry, index) => (
              <tr key={index} className={!entry.employee_id ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.raw_name}
                  </div>
                  {!entry.employee_id && (
                    <div className="text-xs text-red-600">⚠ Not matched</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.check_in_time || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(entry.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getLateBadge(entry.is_late, entry.minutes_late)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.employee_id ? `${Math.round(entry.confidence_score * 100)}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Show Employees */}
      {result.no_show_employees.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-red-800 mb-2">No Show Employees</h4>
          <div className="text-sm text-red-700">
            {result.no_show_employees.join(', ')}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading || result.parsing_errors.length > 0}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isLoading || result.parsing_errors.length > 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Processing...' : 'Confirm Import'}
        </button>
      </div>
    </div>
  );
} 