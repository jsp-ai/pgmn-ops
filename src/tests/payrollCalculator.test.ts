import { describe, it, expect } from 'vitest';
import { parseSlackMessages, calculatePayrollSummary, exportToCSV, DEFAULT_PAYROLL_RULES } from '../utils/payrollCalculator';
import { Employee, SlackMessage } from '../types';

describe('Payroll Calculator', () => {
  const mockEmployees: Employee[] = [
    {
      id: 'emp_001',
      slack_user_id: 'U01234567',
      name: 'John Smith',
      email: 'john@company.com',
      hourly_rate: 25.00
    },
    {
      id: 'emp_002',
      slack_user_id: 'U01234568',
      name: 'Jane Doe',
      email: 'jane@company.com',
      hourly_rate: 30.00
    }
  ];

  const mockMessages: SlackMessage[] = [
    {
      user: 'U01234567',
      text: ':in: Good morning!',
      ts: '1704088800.000100', // 9:00 AM
      date: '2024-01-01'
    },
    {
      user: 'U01234567',
      text: ':out: Heading home!',
      ts: '1704117600.000100', // 5:00 PM (8 hours later)
      date: '2024-01-01'
    },
    {
      user: 'U01234568',
      text: ':in: Sorry I\'m late!',
      ts: '1704092400.000200', // 10:00 AM (1 hour late)
      date: '2024-01-01'
    },
    {
      user: 'U01234568',
      text: ':out: Working late tonight!',
      ts: '1704124800.000200', // 7:00 PM (9 hours of work)
      date: '2024-01-01'
    }
  ];

  describe('parseSlackMessages', () => {
    it('should parse check-in and check-out times correctly', () => {
      const attendanceLogs = parseSlackMessages(mockMessages, mockEmployees);
      
      expect(attendanceLogs).toHaveLength(2);
      
      const johnLog = attendanceLogs.find(log => log.employee_id === 'emp_001');
      expect(johnLog).toBeDefined();
      expect(johnLog?.hours_worked).toBeCloseTo(8, 1);
      expect(johnLog?.is_late).toBe(false);
      
      const janeLog = attendanceLogs.find(log => log.employee_id === 'emp_002');
      expect(janeLog).toBeDefined();
      expect(janeLog?.hours_worked).toBeCloseTo(9, 1);
      expect(janeLog?.is_late).toBe(true);
    });

    it('should handle offline employees (no check-in/out)', () => {
      const offlineMessages: SlackMessage[] = [];
      const attendanceLogs = parseSlackMessages(offlineMessages, mockEmployees);
      
      expect(attendanceLogs).toHaveLength(0);
    });

    it('should handle unknown Slack users', () => {
      const unknownUserMessages: SlackMessage[] = [
        {
          user: 'U99999999',
          text: ':in: Hello',
          ts: '1704088800.000100',
          date: '2024-01-01'
        }
      ];
      
      const attendanceLogs = parseSlackMessages(unknownUserMessages, mockEmployees);
      expect(attendanceLogs).toHaveLength(0);
    });
  });

  describe('calculatePayrollSummary', () => {
    it('should calculate regular hours and overtime correctly', () => {
      const attendanceLogs = parseSlackMessages(mockMessages, mockEmployees);
      const summaries = calculatePayrollSummary(attendanceLogs, mockEmployees);
      
      expect(summaries).toHaveLength(2);
      
      const johnSummary = summaries.find(s => s.employee.id === 'emp_001');
      expect(johnSummary?.total_hours).toBeCloseTo(8, 1);
      expect(johnSummary?.regular_hours).toBeCloseTo(8, 1);
      expect(johnSummary?.overtime_hours).toBeCloseTo(0, 1);
      expect(johnSummary?.gross_pay).toBeCloseTo(200, 0); // 8 * $25
      expect(johnSummary?.late_deductions).toBe(0);
      
      const janeSummary = summaries.find(s => s.employee.id === 'emp_002');
      expect(janeSummary?.total_hours).toBeCloseTo(9, 1);
      expect(janeSummary?.regular_hours).toBeCloseTo(8, 1);
      expect(janeSummary?.overtime_hours).toBeCloseTo(1, 1);
      expect(janeSummary?.late_deductions).toBe(DEFAULT_PAYROLL_RULES.late_deduction_amount);
    });

    it('should apply late deductions correctly', () => {
      const attendanceLogs = parseSlackMessages(mockMessages, mockEmployees);
      const summaries = calculatePayrollSummary(attendanceLogs, mockEmployees);
      
      const janeSummary = summaries.find(s => s.employee.id === 'emp_002');
      expect(janeSummary?.late_days).toBe(1);
      expect(janeSummary?.late_deductions).toBe(10.0);
    });

    it('should handle employees with no attendance logs', () => {
      const summaries = calculatePayrollSummary([], mockEmployees);
      
      expect(summaries).toHaveLength(2);
      summaries.forEach(summary => {
        expect(summary.total_hours).toBe(0);
        expect(summary.gross_pay).toBe(0);
        expect(summary.net_pay).toBe(0);
      });
    });
  });

  describe('exportToCSV', () => {
    it('should generate valid CSV format', () => {
      const attendanceLogs = parseSlackMessages(mockMessages, mockEmployees);
      const summaries = calculatePayrollSummary(attendanceLogs, mockEmployees);
      const csv = exportToCSV(summaries);
      
      expect(csv).toContain('Employee Name');
      expect(csv).toContain('Total Hours');
      expect(csv).toContain('Net Pay');
      expect(csv).toContain('John Smith');
      expect(csv).toContain('Jane Doe');
      
      const lines = csv.split('\n');
      expect(lines.length).toBeGreaterThan(2); // Header + at least 2 data rows
    });
  });
}); 