import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { DateRangePicker } from './components/DateRangePicker';
import { PayrollTable } from './components/PayrollTable';
import { Employee, SlackMessage, PayrollSummary } from './types';
import { parseSlackMessages, calculatePayrollSummary, exportToCSV, getDateRange } from './utils/payrollCalculator';
import employeesData from './data/employees.json';

function App() {
  const [employees] = useState<Employee[]>(employeesData);
  const [slackMessages, setSlackMessages] = useState<SlackMessage[]>([]);
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize with current month's first half as default
  useEffect(() => {
    const { start, end } = getDateRange('first-half');
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  // Calculate payroll whenever messages or date range changes
  useEffect(() => {
    if (slackMessages.length > 0 && startDate && endDate) {
      // Filter messages by date range
      const filteredMessages = slackMessages.filter(msg => {
        const messageDate = new Date(msg.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return messageDate >= start && messageDate <= end;
      });

      const attendanceLogs = parseSlackMessages(filteredMessages, employees);
      const summaries = calculatePayrollSummary(attendanceLogs, employees);
      setPayrollSummaries(summaries);
    } else {
      setPayrollSummaries([]);
    }
  }, [slackMessages, startDate, endDate, employees]);

  const handleDataLoad = (messages: SlackMessage[]) => {
    setSlackMessages(messages);
    
    // Save to localStorage for persistence
    localStorage.setItem('slackMessages', JSON.stringify(messages));
  };

  const handlePeriodPresetSelect = (period: 'first-half' | 'second-half' | 'full-month') => {
    const { start, end } = getDateRange(period);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleExportCSV = () => {
    if (payrollSummaries.length === 0) {
      alert('No payroll data to export');
      return;
    }

    const csvContent = exportToCSV(payrollSummaries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll-summary-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('slackMessages');
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages);
        setSlackMessages(messages);
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payroll Tracking & Calculation Tool
          </h1>
          <p className="text-gray-600">
            Import Slack attendance data and calculate payroll with deductions
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Employees</div>
            <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Messages Loaded</div>
            <div className="text-2xl font-bold text-blue-600">{slackMessages.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Pay Period</div>
            <div className="text-sm font-medium text-gray-900">
              {startDate && endDate ? `${startDate} to ${endDate}` : 'Not set'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Processed Records</div>
            <div className="text-2xl font-bold text-green-600">{payrollSummaries.length}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* File Upload Section */}
          <FileUploader onDataLoad={handleDataLoad} />

          {/* Date Range Picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onPeriodPresetSelect={handlePeriodPresetSelect}
          />

          {/* Payroll Table */}
          <PayrollTable
            payrollSummaries={payrollSummaries}
            onExportCSV={handleExportCSV}
          />
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Internal Payroll Tracking Tool - MVP Phase 0</p>
          <p className="mt-1">
            Parsing Rules: 5min late grace period, $10 late deduction, $50 offline deduction, 1.5x overtime after 8hrs
          </p>
        </div>
      </div>
    </div>
  );
}

export default App; 