import { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { FileUploader } from './components/FileUploader';
import { DateRangePicker } from './components/DateRangePicker';
import { PayrollTable } from './components/PayrollTable';
import { StaffManagement } from './components/StaffManagement/StaffManagement';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AIStatusIndicator } from './components/AIStatusIndicator';
import { ErrorInvestigator } from './components/ErrorInvestigator';
import { useEmployees } from './hooks/useEmployees';
import { usePayroll } from './hooks/usePayroll';

type Page = 'payroll' | 'staff' | 'errors';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('payroll');

  // Custom hooks for state management
  const employees = useEmployees();
  const payroll = usePayroll();

  // Auto-refresh payroll when employees or date range changes
  useEffect(() => {
    const refreshAsync = async () => {
      try {
        await payroll.refreshPayroll(employees.employees);
      } catch (error) {
        console.error('Error refreshing payroll:', error);
      }
    };
    
    refreshAsync();
  }, [employees.employees, payroll.startDate, payroll.endDate, payroll.slackMessages]);

  const renderPayrollPage = () => (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payroll Tracking & Calculation
        </h1>
        <p className="text-gray-600">
          Import Slack attendance data and calculate payroll with deductions
        </p>
      </div>

      {/* Error Display */}
      {payroll.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Payroll Error</p>
                <p className="text-red-700">{payroll.error}</p>
              </div>
            </div>
            <button
              onClick={payroll.clearError}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* AI Status Indicator */}
      <ErrorBoundary>
        <AIStatusIndicator
          reasoning={payroll.aiReasoning}
          confidence={payroll.aiConfidence}
          error={payroll.aiError}
          showDetails={true}
        />
      </ErrorBoundary>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Active Employees</div>
          <div className="text-2xl font-bold text-gray-900">{employees.activeEmployeesCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Messages Loaded</div>
          <div className="text-2xl font-bold text-blue-600">{payroll.totalMessages}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Pay Period</div>
          <div className="text-sm font-medium text-gray-900">
            {payroll.dateRangeDisplay}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Processed Records</div>
          <div className="text-2xl font-bold text-green-600">{payroll.processedRecords}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* File Upload Section */}
        <ErrorBoundary>
          <FileUploader 
            onDataLoad={payroll.loadSlackMessages} 
            employees={employees.employees} 
          />
        </ErrorBoundary>

        {/* Date Range Picker */}
        <ErrorBoundary>
          <DateRangePicker
            startDate={payroll.startDate}
            endDate={payroll.endDate}
            onStartDateChange={(date) => payroll.setDateRange(date, payroll.endDate)}
            onEndDateChange={(date) => payroll.setDateRange(payroll.startDate, date)}
            onPeriodPresetSelect={payroll.setPeriodPreset}
          />
        </ErrorBoundary>

        {/* Payroll Table */}
        <ErrorBoundary>
          <PayrollTable
            payrollSummaries={payroll.payrollSummaries}
            onExportCSV={payroll.exportCSV}
          />
        </ErrorBoundary>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-gray-500 text-sm">
        <p>Internal Payroll Tracking Tool - MVP Phase 0</p>
        <p className="mt-1">
          Parsing Rules: 5min late grace period, $10 late deduction, $50 offline deduction, 1.5x overtime after 8hrs
        </p>
      </div>
    </div>
  );

  const renderStaffPage = () => (
    <ErrorBoundary>
      <StaffManagement />
    </ErrorBoundary>
  );

  const renderErrorPage = () => (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <ErrorInvestigator errorId="390c02b5-2633-4826-b7cd-20343b85a73c" />
      </div>
    </ErrorBoundary>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation Bar */}
        <NavBar currentPage={currentPage} onPageChange={setCurrentPage} />
        
        {/* Page Content */}
        {currentPage === 'staff' ? renderStaffPage() : 
         currentPage === 'errors' ? renderErrorPage() : 
         renderPayrollPage()}
        
        {/* Loading Overlay */}
        {(employees.isLoading || payroll.isLoading) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App; 