import { useState, useEffect, useCallback } from 'react';
import { SlackMessage, PayrollSummary, Employee } from '../types';
import { 
  parseSlackMessagesWithAI, 
  calculatePayrollSummaryWithAI, 
  exportToCSVWithAI, 
  getDateRange 
} from '../utils/aiPayrollCalculator';
import { storageService, StorageConfig } from '../services/storageService';
import { errorService } from '../services/errorService';

const SLACK_MESSAGES_CONFIG: StorageConfig = {
  key: 'pgmn-ops-slack-messages',
  version: 1
};

export interface UsePayrollState {
  slackMessages: SlackMessage[];
  payrollSummaries: PayrollSummary[];
  startDate: string;
  endDate: string;
  isLoading: boolean;
  error: string | null;
  hasMessages: boolean;
  hasPayrollData: boolean;
  totalMessages: number;
  processedRecords: number;
  dateRangeDisplay: string;
  aiReasoning?: string;
  aiConfidence?: number;
  aiError?: string;
}

export interface UsePayrollActions {
  loadSlackMessages: (messages: SlackMessage[]) => Promise<void>;
  setDateRange: (start: string, end: string) => void;
  setPeriodPreset: (period: 'first-half' | 'second-half' | 'full-month') => void;
  exportCSV: () => void;
  clearError: () => void;
  refreshPayroll: (employees: Employee[]) => Promise<void>;
}

export function usePayroll(): UsePayrollState & UsePayrollActions {
  const [state, setState] = useState<UsePayrollState>({
    slackMessages: [],
    payrollSummaries: [],
    startDate: '',
    endDate: '',
    isLoading: false,
    error: null,
    hasMessages: false,
    hasPayrollData: false,
    totalMessages: 0,
    processedRecords: 0,
    dateRangeDisplay: 'Not set',
    aiReasoning: undefined,
    aiConfidence: undefined,
    aiError: undefined
  });

  // Initialize with current month's first half as default
  useEffect(() => {
    const { start, end } = getDateRange('first-half');
    setState(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
  }, []);

  // Load saved messages on mount
  useEffect(() => {
    loadSavedMessages();
  }, []);

  const loadSavedMessages = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const result = await errorService.withErrorHandling(
      async () => {
        const storageResult = await storageService.load<SlackMessage[]>(SLACK_MESSAGES_CONFIG);
        return storageResult.data || [];
      },
      'PAYROLL_LOAD',
      'Failed to load saved Slack messages'
    );

    if (result.success) {
      setState(prev => ({
        ...prev,
        slackMessages: result.data || [],
        isLoading: false
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error?.message || 'Failed to load messages'
      }));
    }
  };

  const loadSlackMessages = useCallback(async (messages: SlackMessage[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const result = await errorService.withErrorHandling(
      async () => {
        await storageService.save(SLACK_MESSAGES_CONFIG, messages);
        return messages;
      },
      'PAYROLL_SAVE',
      'Failed to save Slack messages'
    );

    if (result.success) {
      setState(prev => ({
        ...prev,
        slackMessages: messages,
        isLoading: false
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error?.message || 'Failed to save messages'
      }));
    }
  }, []);

  const setDateRange = useCallback((start: string, end: string) => {
    setState(prev => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
  }, []);

  const setPeriodPreset = useCallback((period: 'first-half' | 'second-half' | 'full-month') => {
    const { start, end } = getDateRange(period);
    setState(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
  }, []);

  const exportCSV = useCallback(() => {
    if (state.payrollSummaries.length === 0) {
      errorService.handleError('No payroll data to export', 'EXPORT', 'warning');
      return;
    }

    try {
      const csvContent = exportToCSVWithAI(state.payrollSummaries);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `payroll-summary-${state.startDate}-to-${state.endDate}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      errorService.handleError(error as Error, 'EXPORT', 'error');
    }
  }, [state.payrollSummaries, state.startDate, state.endDate]);

  const refreshPayroll = useCallback(async (employees: Employee[]) => {
    if (state.slackMessages.length === 0 || !state.startDate || !state.endDate || employees.length === 0) {
      setState(prev => ({ ...prev, payrollSummaries: [] }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Use only active employees for payroll calculations
      const activeEmployees = employees.filter(emp => emp.status === 'active');
      
      // Filter messages by date range
      const filteredMessages = state.slackMessages.filter(msg => {
        const messageDate = new Date(msg.date);
        const start = new Date(state.startDate);
        const end = new Date(state.endDate);
        return messageDate >= start && messageDate <= end;
      });

      // Use AI-powered parsing
      const attendanceResult = await parseSlackMessagesWithAI(filteredMessages, activeEmployees);
      
      if (attendanceResult.error) {
        console.warn('AI parsing had issues:', attendanceResult.error);
      }

      // Use AI-powered payroll calculation
      const payrollResult = await calculatePayrollSummaryWithAI(attendanceResult.logs, activeEmployees);
      
      if (payrollResult.error) {
        console.warn('AI calculation had issues:', payrollResult.error);
      }

      setState(prev => ({
        ...prev,
        payrollSummaries: payrollResult.summaries,
        isLoading: false,
        error: null,
        aiReasoning: payrollResult.reasoning,
        aiConfidence: payrollResult.confidence,
        aiError: attendanceResult.error || payrollResult.error
      }));
    } catch (error) {
      const appError = errorService.handleError(error as Error, 'PAYROLL_CALCULATION', 'error');
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: appError.message
      }));
    }
  }, [state.slackMessages, state.startDate, state.endDate]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Update computed values whenever state changes
  useEffect(() => {
    const computedValues = {
      hasMessages: state.slackMessages.length > 0,
      hasPayrollData: state.payrollSummaries.length > 0,
      totalMessages: state.slackMessages.length,
      processedRecords: state.payrollSummaries.length,
      dateRangeDisplay: state.startDate && state.endDate 
        ? `${state.startDate} to ${state.endDate}` 
        : 'Not set'
    };

    setState(prev => ({
      ...prev,
      ...computedValues
    }));
  }, [state.slackMessages.length, state.payrollSummaries.length, state.startDate, state.endDate]);

  return {
    ...state,
    loadSlackMessages,
    setDateRange,
    setPeriodPreset,
    exportCSV,
    clearError,
    refreshPayroll
  };
} 