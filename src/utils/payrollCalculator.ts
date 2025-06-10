import { Employee, SlackMessage, AttendanceLog, PayrollSummary, PayrollRules } from '../types';

export const DEFAULT_PAYROLL_RULES: PayrollRules = {
  standard_work_hours: 8,
  overtime_multiplier: 1.5,
  late_grace_period_minutes: 5,
  late_deduction_amount: 10.0,
  offline_deduction_amount: 50.0,
};

export function parseSlackMessages(
  messages: SlackMessage[],
  employees: Employee[]
): AttendanceLog[] {
  const employeeMap = new Map(employees.map(emp => [emp.slack_user_id, emp]));
  const attendanceMap = new Map<string, Partial<AttendanceLog>>();

  // Group messages by user and date
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

  // Calculate attendance details
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
    startOfDay.setHours(9, 0, 0, 0); // Assuming 9 AM standard start
    
    const isLate = log.check_in > new Date(startOfDay.getTime() + DEFAULT_PAYROLL_RULES.late_grace_period_minutes * 60 * 1000);

    return {
      ...log,
      is_late: isLate,
      hours_worked: Math.max(0, hoursWorked),
    } as AttendanceLog;
  });
}

export function calculatePayrollSummary(
  attendanceLogs: AttendanceLog[],
  employees: Employee[],
  rules: PayrollRules = DEFAULT_PAYROLL_RULES
): PayrollSummary[] {
  const summaryMap = new Map<string, PayrollSummary>();

  // Initialize summaries
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

  // Process attendance logs
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

  // Calculate pay
  return Array.from(summaryMap.values()).map(summary => {
    const regularHours = Math.min(summary.total_hours, rules.standard_work_hours * 5); // 5 work days
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

export function exportToCSV(payrollSummaries: PayrollSummary[]): string {
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

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

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
        end: new Date(year, month + 1, 0) // Last day of month
      };
    case 'full-month':
    default:
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0)
      };
  }
} 