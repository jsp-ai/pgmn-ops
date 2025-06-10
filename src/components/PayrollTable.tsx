import { PayrollSummary } from '../types';

interface PayrollTableProps {
  payrollSummaries: PayrollSummary[];
  onExportCSV: () => void;
}

export function PayrollTable({ payrollSummaries, onExportCSV }: PayrollTableProps) {
  const totalGrossPay = payrollSummaries.reduce((sum, summary) => sum + summary.gross_pay, 0);
  const totalNetPay = payrollSummaries.reduce((sum, summary) => sum + summary.net_pay, 0);
  const totalDeductions = payrollSummaries.reduce((sum, summary) => sum + summary.late_deductions + summary.offline_deductions, 0);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatHours = (hours: number) => `${hours.toFixed(2)}h`;

  if (payrollSummaries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Payroll Summary</h2>
        <div className="text-center py-8 text-gray-500">
          No payroll data available. Please import attendance data first.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Payroll Summary</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Total Gross Pay</div>
          <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalGrossPay)}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-red-600 font-medium">Total Deductions</div>
          <div className="text-2xl font-bold text-red-900">{formatCurrency(totalDeductions)}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Total Net Pay</div>
          <div className="text-2xl font-bold text-green-900">{formatCurrency(totalNetPay)}</div>
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