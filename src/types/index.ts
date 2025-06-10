export interface Employee {
  id: string;
  slack_user_id: string;
  name: string;
  email: string;
  hourly_rate: number;
}

export interface SlackMessage {
  user: string;
  text: string;
  ts: string;
  date: string;
}

export interface AttendanceLog {
  employee_id: string;
  date: string;
  check_in?: Date;
  check_out?: Date;
  is_late: boolean;
  is_offline: boolean;
  hours_worked: number;
}

export interface PayrollItem {
  employee_id: string;
  employee_name: string;
  hours_worked: number;
  overtime_hours: number;
  late_deductions: number;
  offline_deductions: number;
  gross_pay: number;
  net_pay: number;
  hourly_rate: number;
}

export interface PayrollSummary {
  employee: Employee;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  late_days: number;
  offline_days: number;
  late_deductions: number;
  offline_deductions: number;
  gross_pay: number;
  net_pay: number;
}

export interface PayrollRules {
  standard_work_hours: number;
  overtime_multiplier: number;
  late_grace_period_minutes: number;
  late_deduction_amount: number;
  offline_deduction_amount: number;
} 