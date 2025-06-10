import { AttendanceParseResult, ParsedAttendanceEntry, Employee } from '../../types';

interface ParsePreviewProps {
  result: AttendanceParseResult;
  employees: Employee[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ParsePreview({ result, employees, onConfirm, onCancel, isLoading = false }: ParsePreviewProps) {
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

  // Calculate preview payroll impact
  const calculatePayrollPreview = () => {
    const payrollPreview = result.entries
      .filter(entry => entry.employee_id)
      .map(entry => {
        const employee = employees.find(emp => emp.id === entry.employee_id);
        if (!employee) return null;

        // Basic calculation for preview
        const hoursWorked = entry.status === 'approved_out' || entry.status === 'no_show' ? 0 : 8;
        const regularHours = Math.min(hoursWorked, 8);
        const overtimeHours = Math.max(hoursWorked - 8, 0);
        const grossPay = (regularHours * employee.hourly_rate) + (overtimeHours * employee.hourly_rate * 1.5);
        const lateDeduction = entry.is_late ? 10 : 0;
        const offlineDeduction = entry.status === 'no_show' ? 50 : 0;
        const netPay = grossPay - lateDeduction - offlineDeduction;

        return {
          employee,
          entry,
          hoursWorked,
          regularHours,
          overtimeHours,
          grossPay,
          lateDeduction,
          offlineDeduction,
          netPay
        };
      })
      .filter(Boolean);

    return payrollPreview;
  };

  const payrollPreview = calculatePayrollPreview();
  const totalGrossPay = payrollPreview.reduce((sum, item) => sum + (item?.grossPay || 0), 0);
  const totalDeductions = payrollPreview.reduce((sum, item) => sum + (item?.lateDeduction || 0) + (item?.offlineDeduction || 0), 0);
  const totalNetPay = totalGrossPay - totalDeductions;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">📊 Slack Import Preview & Payroll Impact</h3>
      
      {/* Connection Flow Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-3 mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v1m0-1h6m-6 1v1m0-1h6m-6 1v8a1 1 0 001 1h4a1 1 0 001-1v-8" />
              </svg>
            </div>
            <div className="text-sm font-medium text-blue-800">Slack Input</div>
            <div className="text-xs text-blue-600">{result.entries.length} records</div>
          </div>
          
          <div className="flex-1 border-t-2 border-blue-300 border-dashed relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-100 px-2 py-1 rounded text-xs text-blue-700">
              Processing
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-sm font-medium text-green-800">Payroll Output</div>
            <div className="text-xs text-green-600">${totalNetPay.toFixed(2)} total</div>
          </div>
        </div>
      </div>

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

      {/* Payroll Impact Preview */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-800 mb-3">💰 Expected Payroll Impact</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">${totalGrossPay.toFixed(2)}</div>
            <div className="text-sm text-blue-700">Gross Pay</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">-${totalDeductions.toFixed(2)}</div>
            <div className="text-sm text-red-700">Deductions</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">${totalNetPay.toFixed(2)}</div>
            <div className="text-sm text-green-700">Net Pay</div>
          </div>
        </div>
      </div>

      {/* Errors and Warnings */}
      {(result.parsing_errors.length > 0 || result.unmatched_names.length > 0) && (
        <div className="mb-6">
          {result.parsing_errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-800 mb-2">⚠️ Parsing Errors</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {result.parsing_errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {result.unmatched_names.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">🔍 Unmatched Names</h4>
              <div className="text-sm text-yellow-700">
                Could not match: {result.unmatched_names.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Data: Attendance Entries Table */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">📝 Input: Parsed Attendance Data</h4>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lateness
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {result.entries.map((entry, index) => (
                <tr key={index} className={!entry.employee_id ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.raw_name}
                    </div>
                    {!entry.employee_id && (
                      <div className="text-xs text-red-600">⚠ Not matched</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.check_in_time || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(entry.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getLateBadge(entry.is_late, entry.minutes_late)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.employee_id ? `${Math.round(entry.confidence_score * 100)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Output Preview: Expected Payroll Calculations */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">💼 Output: Expected Payroll Summary</h4>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Pay
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollPreview.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item?.employee.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item?.entry.status === 'approved_out' ? 'Approved Out' : 
                       item?.entry.status === 'no_show' ? 'No Show' : 'Present'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item?.hoursWorked}h
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item?.employee.hourly_rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${item?.grossPay.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(item?.lateDeduction || 0) + (item?.offlineDeduction || 0) > 0 ? (
                      <span className="text-red-600">
                        -${((item?.lateDeduction || 0) + (item?.offlineDeduction || 0)).toFixed(2)}
                      </span>
                    ) : (
                      '$0.00'
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${item?.netPay.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Show Employees */}
      {result.no_show_employees.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-red-800 mb-2">🚫 No Show Employees (Will Receive $50 Deduction)</h4>
          <div className="text-sm text-red-700">
            {result.no_show_employees.join(', ')}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          ✨ Import this data to automatically generate detailed payroll summaries
        </div>
        <div className="flex space-x-4">
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
            className={`px-6 py-2 rounded-md text-sm font-medium ${
              isLoading || result.parsing_errors.length > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700'
            }`}
          >
            {isLoading ? 'Processing...' : '🚀 Import & Generate Payroll'}
          </button>
        </div>
      </div>
    </div>
  );
} 