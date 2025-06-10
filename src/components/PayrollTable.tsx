import { PayrollSummary } from '../types';

interface PayrollTableProps {
  payrollSummaries: PayrollSummary[];
  onExportCSV: () => void;
}

export function PayrollTable({ payrollSummaries, onExportCSV }: PayrollTableProps) {
  const totalGrossPay = payrollSummaries.reduce((sum, summary) => sum + summary.gross_pay, 0);
  const totalNetPay = payrollSummaries.reduce((sum, summary) => sum + summary.net_pay, 0);
  const totalDeductions = payrollSummaries.reduce((sum, summary) => sum + summary.late_deductions + summary.offline_deductions, 0);
  const totalHours = payrollSummaries.reduce((sum, summary) => sum + summary.total_hours, 0);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatHours = (hours: number) => `${hours.toFixed(2)}h`;

  if (payrollSummaries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">💼 Payroll Summary</h2>
          <div className="text-sm text-gray-500">Generated from Slack attendance data</div>
        </div>
        <div className="text-center py-12">
          <div className="bg-blue-50 rounded-lg p-8">
            <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v1m0-1h6m-6 1v1m0-1h6m-6 1v8a1 1 0 001 1h4a1 1 0 001-1v-8" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Payroll Data Available</h3>
            <p className="text-gray-600 mb-4">Import attendance data from Slack to automatically generate payroll summaries</p>
            <div className="text-sm text-blue-600 bg-blue-100 rounded-md p-3">
              📝 Use the "Import from Slack" tab above to paste attendance data and generate detailed payroll calculations
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">💼 Payroll Summary</h2>
          <div className="text-sm text-gray-500 mt-1">
            📊 Generated from imported Slack attendance data • {payrollSummaries.length} employees • {formatHours(totalHours)} total hours
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onExportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-600 font-medium">Total Hours</div>
              <div className="text-2xl font-bold text-purple-900">{formatHours(totalHours)}</div>
            </div>
            <div className="bg-purple-100 rounded-full p-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xs text-purple-500 mt-1">From Slack data</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium">Gross Pay</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalGrossPay)}</div>
            </div>
            <div className="bg-blue-100 rounded-full p-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="text-xs text-blue-500 mt-1">Hours × rates</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-600 font-medium">Deductions</div>
              <div className="text-2xl font-bold text-red-900">{formatCurrency(totalDeductions)}</div>
            </div>
            <div className="bg-red-100 rounded-full p-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
          <div className="text-xs text-red-500 mt-1">Late + offline</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-600 font-medium">Net Pay</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(totalNetPay)}</div>
            </div>
            <div className="bg-green-100 rounded-full p-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xs text-green-500 mt-1">Final amount</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Hours
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Regular Hours
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Overtime Hours
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issues
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payrollSummaries.map((summary) => (
              <tr key={summary.employee.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{summary.employee.name}</div>
                  <div className="text-sm text-gray-500">{summary.employee.email}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatHours(summary.total_hours)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatHours(summary.regular_hours)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {summary.overtime_hours > 0 ? (
                    <span className="text-amber-600 font-medium">{formatHours(summary.overtime_hours)}</span>
                  ) : (
                    formatHours(summary.overtime_hours)
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(summary.employee.hourly_rate)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(summary.gross_pay)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {summary.late_deductions + summary.offline_deductions > 0 ? (
                    <span className="text-red-600">
                      {formatCurrency(summary.late_deductions + summary.offline_deductions)}
                    </span>
                  ) : (
                    formatCurrency(0)
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {formatCurrency(summary.net_pay)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-1">
                    {summary.late_days > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {summary.late_days} late
                      </span>
                    )}
                    {summary.offline_days > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {summary.offline_days} offline
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 