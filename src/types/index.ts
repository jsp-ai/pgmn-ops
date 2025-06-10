export interface Employee {
  id: string;
  slack_user_id: string;
  name: string;
  email: string;
  hourly_rate: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  notes?: string;
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

export interface StaffManagementState {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  sortBy: keyof Employee;
  sortDirection: 'asc' | 'desc';
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface EmployeeFormData {
  name: string;
  email: string;
  slack_user_id: string;
  hourly_rate: string;
  notes: string;
}

// Slack Text Parser Types
export type AttendanceStatus = 
  | 'check_in'
  | 'approved_out' 
  | 'work_from_home'
  | 'eta_delayed'
  | 'no_show'
  | 'unknown';

export interface ParsedAttendanceEntry {
  raw_name: string;
  employee_id?: string;
  check_in_time?: string;
  status: AttendanceStatus;
  is_late: boolean;
  minutes_late: number;
  confidence_score: number; // 0-1 for name matching
  day_rate_applicable: boolean;
  deduction_amount: number;
  deduction_reason?: string;
  eta_time?: string; // For ETA messages
  approval_code?: string; // For approved absences
}

export interface AttendanceParseResult {
  date: string;
  entries: ParsedAttendanceEntry[];
  unmatched_names: string[];
  parsing_errors: string[];
  no_show_employees: string[]; // Employees expected but not found
  summary: {
    total_entries: number;
    check_ins: number;
    approved_absences: number;
    work_from_home: number;
    late_arrivals: number;
    no_shows: number;
    unmatched: number;
    total_deductions: number;
  };
}

export interface AttendanceSettings {
  default_start_time: string; // "10:00 AM"
  timezone: string; // "Asia/Manila"
  grace_period_minutes: number; // 5
  late_penalty_per_minute: number; // 0
}

// Enhanced Employee with start time overrides
export interface EmployeeWithSettings extends Employee {
  start_time?: string; // Override default start time
  timezone?: string; // Employee-specific timezone
  grace_period_minutes?: number; // Individual grace period
} 