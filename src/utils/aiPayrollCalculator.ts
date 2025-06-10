import { Employee, SlackMessage, AttendanceLog, PayrollSummary, PayrollRules } from '../types';
import { openaiService, ComputationRequest } from '../services/openaiService';

export const DEFAULT_PAYROLL_RULES: PayrollRules = {
  standard_work_hours: 8,
  overtime_multiplier: 1.5,
  late_grace_period_minutes: 5,
  late_deduction_amount: 10.0,
  offline_deduction_amount: 50.0,
};

/**
 * AI-Powered Slack Message Parser
 * Uses OpenAI ChatGPT to parse Slack messages into attendance logs
 */
export async function parseSlackMessagesWithAI(
  messages: SlackMessage[],
  employees: Employee[],
  rules: PayrollRules = DEFAULT_PAYROLL_RULES
): Promise<{ logs: AttendanceLog[]; reasoning?: string; confidence?: number; error?: string }> {
  try {
    const request: ComputationRequest = {
      type: 'attendance_parsing',
      data: {
        messages,
        employees
      },
      rules,
      context: 'Parse Slack attendance messages into structured logs with lateness and offline detection'
    };

    const response = await openaiService.parseAttendance(request);

    if (!response.success) {
      console.warn('AI parsing failed, falling back to traditional parsing:', response.error);
      return {
        logs: parseSlackMessagesFallback(messages, employees, rules),
        error: `AI parsing failed: ${response.error}. Used fallback method.`
      };
    }

    return {
      logs: response.result,
      reasoning: response.reasoning,
      confidence: response.confidence
    };
  } catch (error) {
    console.error('Error in AI parsing:', error);
    return {
      logs: parseSlackMessagesFallback(messages, employees, rules),
      error: `AI parsing error: ${(error as Error).message}. Used fallback method.`
    };
  }
}

/**
 * AI-Powered Payroll Calculator
 * Uses OpenAI ChatGPT to calculate payroll summaries with consistent logic
 */
export async function calculatePayrollSummaryWithAI(
  attendanceLogs: AttendanceLog[],
  employees: Employee[],
  rules: PayrollRules = DEFAULT_PAYROLL_RULES
): Promise<{ summaries: PayrollSummary[]; reasoning?: string; confidence?: number; error?: string }> {
  try {
    const request: ComputationRequest = {
      type: 'payroll_calculation',
      data: {
        attendanceLogs,
        employees
      },
      rules,
      context: 'Calculate accurate payroll summaries with overtime, deductions, and net pay'
    };

    const response = await openaiService.calculatePayroll(request);

    if (!response.success) {
      console.warn('AI calculation failed, falling back to traditional calculation:', response.error);
      return {
        summaries: calculatePayrollSummaryFallback(attendanceLogs, employees, rules),
        error: `AI calculation failed: ${response.error}. Used fallback method.`
      };
    }

    return {
      summaries: response.result,
      reasoning: response.reasoning,
      confidence: response.confidence
    };
  } catch (error) {
    console.error('Error in AI calculation:', error);
    return {
      summaries: calculatePayrollSummaryFallback(attendanceLogs, employees, rules),
      error: `AI calculation error: ${(error as Error).message}. Used fallback method.`
    };
  }
}

/**
 * AI-Powered Dashboard Metrics Calculator
 * Uses OpenAI ChatGPT to calculate dashboard metrics consistently
 */
export async function calculateDashboardMetricsWithAI(data: {
  payrollSummaries: PayrollSummary[];
  employees: Employee[];
  slackMessages: SlackMessage[];
}): Promise<{ 
  metrics: any; 
  reasoning?: string; 
  confidence?: number; 
  error?: string 
}> {
  try {
    const request: ComputationRequest = {
      type: 'dashboard_metrics',
      data,
      context: 'Calculate comprehensive dashboard metrics for payroll and attendance tracking'
    };

    const response = await openaiService.calculateDashboardMetrics(request);

    if (!response.success) {
      console.warn('AI metrics calculation failed, falling back to traditional calculation:', response.error);
      return {
        metrics: calculateDashboardMetricsFallback(data),
        error: `AI metrics calculation failed: ${response.error}. Used fallback method.`
      };
    }

    return {
      metrics: response.result,
      reasoning: response.reasoning,
      confidence: response.confidence
    };
  } catch (error) {
    console.error('Error in AI metrics calculation:', error);
    return {
      metrics: calculateDashboardMetricsFallback(data),
      error: `AI metrics calculation error: ${(error as Error).message}. Used fallback method.`
    };
  }
}

/**
 * Enhanced CSV Export with AI reasoning
 */
export function exportToCSVWithAI(
  payrollSummaries: PayrollSummary[], 
  aiReasoning?: string,
  confidence?: number
): string {
  const headers = [
    'Employee Name',
    'Total Hours',
    'Regular Hours',
    'Overtime Hours',
    'Late Days',
    'Offline Days',
    'Hourly Rate',
    'Gross Pay',
    'Late Deductions',
    'Offline Deductions',
    'Net Pay'
  ];

  const rows = payrollSummaries.map(summary => [
    summary.employee.name,
    summary.total_hours.toFixed(2),
    summary.regular_hours.toFixed(2),
    summary.overtime_hours.toFixed(2),
    summary.late_days.toString(),
    summary.offline_days.toString(),
    `$${summary.employee.hourly_rate.toFixed(2)}`,
    `$${summary.gross_pay.toFixed(2)}`,
    `$${summary.late_deductions.toFixed(2)}`,
    `$${summary.offline_deductions.toFixed(2)}`,
    `$${summary.net_pay.toFixed(2)}`
  ]);

  let csv = [headers, ...rows].map(row => row.join(',')).join('\n');

  // Add AI reasoning as comments if available
  if (aiReasoning) {
    csv = `# AI Calculation Reasoning: ${aiReasoning}\n` +
          `# AI Confidence Level: ${((confidence || 0) * 100).toFixed(1)}%\n` +
          `# Generated on: ${new Date().toISOString()}\n\n` +
          csv;
  }

  return csv;
}

// Fallback functions for when AI is unavailable
function parseSlackMessagesFallback(
  messages: SlackMessage[],
  employees: Employee[],
  rules: PayrollRules
): AttendanceLog[] {
  const employeeMap = new Map(employees.map(emp => [emp.slack_user_id, emp]));
  const attendanceMap = new Map<string, Partial<AttendanceLog>>();

  messages.forEach(message => {
    const employee = employeeMap.get(message.user);
    if (!employee) return;

    const key = `${employee.id}-${message.date}`;
    const timestamp = new Date(parseFloat(message.ts) * 1000);
    
    if (!attendanceMap.has(key)) {
      attendanceMap.set(key, {
        employee_id: employee.id,
        date: message.date,
        is_late: false,
        is_offline: false,
        hours_worked: 0,
      });
    }

    const log = attendanceMap.get(key)!;

    if (message.text.includes(':in:')) {
      log.check_in = timestamp;
    } else if (message.text.includes(':out:')) {
      log.check_out = timestamp;
    }
  });

  return Array.from(attendanceMap.values()).map(log => {
    if (!log.check_in || !log.check_out) {
      return {
        ...log,
        is_offline: !log.check_in && !log.check_out,
        hours_worked: 0,
      } as AttendanceLog;
    }

    const hoursWorked = (log.check_out.getTime() - log.check_in.getTime()) / (1000 * 60 * 60);
    const startOfDay = new Date(log.check_in);
    startOfDay.setHours(9, 0, 0, 0);
    
    const isLate = log.check_in > new Date(startOfDay.getTime() + rules.late_grace_period_minutes * 60 * 1000);

    return {
      ...log,
      is_late: isLate,
      hours_worked: Math.max(0, hoursWorked),
    } as AttendanceLog;
  });
}

function calculatePayrollSummaryFallback(
  attendanceLogs: AttendanceLog[],
  employees: Employee[],
  rules: PayrollRules
): PayrollSummary[] {
  const summaryMap = new Map<string, PayrollSummary>();

  employees.forEach(employee => {
    summaryMap.set(employee.id, {
      employee,
      total_hours: 0,
      regular_hours: 0,
      overtime_hours: 0,
      late_days: 0,
      offline_days: 0,
      late_deductions: 0,
      offline_deductions: 0,
      gross_pay: 0,
      net_pay: 0,
    });
  });

  attendanceLogs.forEach(log => {
    const summary = summaryMap.get(log.employee_id);
    if (!summary) return;

    summary.total_hours += log.hours_worked;
    
    if (log.is_late) {
      summary.late_days += 1;
      summary.late_deductions += rules.late_deduction_amount;
    }
    
    if (log.is_offline) {
      summary.offline_days += 1;
      summary.offline_deductions += rules.offline_deduction_amount;
    }
  });

  return Array.from(summaryMap.values()).map(summary => {
    const regularHours = Math.min(summary.total_hours, rules.standard_work_hours * 5);
    const overtimeHours = Math.max(0, summary.total_hours - regularHours);
    
    const regularPay = regularHours * summary.employee.hourly_rate;
    const overtimePay = overtimeHours * summary.employee.hourly_rate * rules.overtime_multiplier;
    const grossPay = regularPay + overtimePay;
    const totalDeductions = summary.late_deductions + summary.offline_deductions;
    const netPay = Math.max(0, grossPay - totalDeductions);

    return {
      ...summary,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      gross_pay: grossPay,
      net_pay: netPay,
    };
  });
}

function calculateDashboardMetricsFallback(data: {
  payrollSummaries: PayrollSummary[];
  employees: Employee[];
  slackMessages: SlackMessage[];
}) {
  const { payrollSummaries, employees, slackMessages } = data;

  return {
    activeEmployeesCount: employees.filter(emp => emp.status === 'active').length,
    totalMessages: slackMessages.length,
    processedRecords: payrollSummaries.length,
    totalLateDays: payrollSummaries.reduce((sum, summary) => sum + summary.late_days, 0),
    totalOvertimeHours: payrollSummaries.reduce((sum, summary) => sum + summary.overtime_hours, 0),
    totalDeductions: payrollSummaries.reduce((sum, summary) => sum + summary.late_deductions + summary.offline_deductions, 0),
    averageHoursWorked: payrollSummaries.length > 0 
      ? payrollSummaries.reduce((sum, summary) => sum + summary.total_hours, 0) / payrollSummaries.length 
      : 0,
    attendanceRate: employees.length > 0 
      ? (payrollSummaries.filter(summary => summary.total_hours > 0).length / employees.filter(emp => emp.status === 'active').length) * 100 
      : 0
  };
}

// Re-export utilities that don't need AI enhancement
export function getDateRange(period: 'first-half' | 'second-half' | 'full-month', date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  switch (period) {
    case 'first-half':
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month, 15)
      };
    case 'second-half':
      return {
        start: new Date(year, month, 16),
        end: new Date(year, month + 1, 0)
      };
    case 'full-month':
    default:
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0)
      };
  }
} 