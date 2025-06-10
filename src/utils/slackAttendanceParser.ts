import { Employee, EmployeeWithSettings, AttendanceStatus, ParsedAttendanceEntry, AttendanceParseResult, AttendanceSettings } from '../types';

export class SlackAttendanceTextParser {
  private defaultSettings: AttendanceSettings = {
    default_start_time: "10:00 AM",
    timezone: "Asia/Manila",
    grace_period_minutes: 5,
    late_penalty_per_minute: 0
  };

  private statusPatterns = {
    approved_out: /OUT\s*-\s*JSP\s*Approved|Approved\s*Leave|Sick\s*Leave\s*-\s*Approved/i,
    work_from_home: /WFH|Work\s*from\s*Home|Remote/i,
    eta_delayed: /ETA\s*(\d{1,2}:\d{2})/i,
    check_in: /\bIN\b|\bin\b/i
  };

  private datePattern = /start\s+date\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i;
  private timePattern = /\[?(\d{1,2}:\d{2}\s*(?:AM|PM))\]?/i;
  private namePattern = /^([^[\d\n]+?)(?=\s*\[?\d|\s*$)/m;

  constructor(private employees: Employee[], settings?: Partial<AttendanceSettings>) {
    this.defaultSettings = { ...this.defaultSettings, ...settings };
  }

  parseSlackText(text: string): AttendanceParseResult {
    const date = this.extractDate(text);
    const sections = this.splitIntoEmployeeSections(text);
    const entries = sections
      .map(section => this.parseEmployeeSection(section))
      .filter((entry): entry is ParsedAttendanceEntry => entry !== null);
    const noShowEmployees = this.identifyNoShowEmployees(entries);
    
    return {
      date: date || new Date().toISOString().split('T')[0],
      entries,
      unmatched_names: entries.filter(e => !e.employee_id).map(e => e.raw_name),
      parsing_errors: this.validateEntries(entries),
      no_show_employees: noShowEmployees,
      summary: this.generateSummary(entries, noShowEmployees)
    };
  }

  private extractDate(text: string): string | null {
    const match = text.match(this.datePattern);
    if (match) {
      const [, dateStr] = match;
      // Convert MM/DD/YY to YYYY-MM-DD format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        let [month, day, year] = parts;
        year = year.length === 2 ? `20${year}` : year;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    return null;
  }

  private splitIntoEmployeeSections(text: string): string[] {
    // Remove the header line and split by double newlines or employee patterns
    const cleanText = text.replace(/start\s+date[^\n]*\n/i, '');
    
    // Split by employee name patterns (names followed by time or status)
    const sections = cleanText
      .split(/\n(?=\w+.*(?:\[?\d{1,2}:\d{2}|IN|OUT|WFH|ETA))/i)
      .filter(section => section.trim().length > 0)
      .map(section => section.trim());

    return sections;
  }

  private parseEmployeeSection(section: string): ParsedAttendanceEntry | null {
    if (!section.trim()) return null;

    const lines = section.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    // Extract name from first line
    const nameMatch = lines[0].match(this.namePattern);
    const rawName = nameMatch ? nameMatch[1].trim() : lines[0].trim();

    // Find time and status in the section
    const timeMatch = section.match(this.timePattern);
    const checkInTime = timeMatch ? timeMatch[1] : undefined;

    // Determine status
    const status = this.determineAttendanceStatus(section);
    
    // Match employee
    const employee = this.matchEmployeeName(rawName);
    const confidenceScore = employee ? this.calculateNameMatchScore(rawName, employee.name) : 0;

    // Calculate lateness
    const latenessInfo = this.calculateLateness(checkInTime, employee || undefined, status);

    return {
      raw_name: rawName,
      employee_id: employee?.id,
      check_in_time: checkInTime,
      status,
      is_late: latenessInfo.isLate,
      minutes_late: latenessInfo.minutesLate,
      confidence_score: confidenceScore,
      day_rate_applicable: this.isDayRateApplicable(status),
      deduction_amount: this.calculateDeductions(status, latenessInfo.minutesLate),
      deduction_reason: latenessInfo.isLate ? `Late by ${latenessInfo.minutesLate} minutes` : undefined,
      eta_time: this.extractETATime(section),
      approval_code: this.extractApprovalCode(section)
    };
  }

  private determineAttendanceStatus(section: string): AttendanceStatus {
    if (this.statusPatterns.approved_out.test(section)) return 'approved_out';
    if (this.statusPatterns.work_from_home.test(section)) return 'work_from_home';
    if (this.statusPatterns.eta_delayed.test(section)) return 'eta_delayed';
    if (this.statusPatterns.check_in.test(section)) return 'check_in';
    return 'unknown';
  }

  private matchEmployeeName(rawName: string): Employee | null {
    // Exact match first
    const exactMatch = this.employees.find(emp => 
      emp.name.toLowerCase() === rawName.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Fuzzy match by checking if employee name contains or is contained in raw name
    const fuzzyMatch = this.employees.find(emp => {
      const empName = emp.name.toLowerCase();
      const raw = rawName.toLowerCase();
      
      // Check if names match when removing common suffixes/prefixes
      const cleanEmpName = empName.replace(/\s+(jr|sr|iii?|iv)\b/g, '').trim();
      const cleanRawName = raw.replace(/\s+(jr|sr|iii?|iv)\b/g, '').trim();
      
      return cleanEmpName.includes(cleanRawName) || 
             cleanRawName.includes(cleanEmpName) ||
             this.calculateLevenshteinDistance(cleanEmpName, cleanRawName) <= 2;
    });

    return fuzzyMatch || null;
  }

  private calculateNameMatchScore(rawName: string, employeeName: string): number {
    const raw = rawName.toLowerCase();
    const emp = employeeName.toLowerCase();
    
    if (raw === emp) return 1.0;
    
    const distance = this.calculateLevenshteinDistance(raw, emp);
    const maxLength = Math.max(raw.length, emp.length);
    
    return Math.max(0, 1 - (distance / maxLength));
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculateLateness(checkInTime?: string, employee?: Employee, status?: AttendanceStatus): { isLate: boolean; minutesLate: number } {
    if (!checkInTime || status === 'approved_out' || status === 'work_from_home') {
      return { isLate: false, minutesLate: 0 };
    }

    const employeeWithSettings = employee as EmployeeWithSettings;
    const startTime = employeeWithSettings?.start_time || this.defaultSettings.default_start_time;
    const gracePeriod = employeeWithSettings?.grace_period_minutes || this.defaultSettings.grace_period_minutes;

    try {
      const checkIn = this.parseTime(checkInTime);
      const start = this.parseTime(startTime);
      
      const diffMinutes = (checkIn.getTime() - start.getTime()) / (1000 * 60);
      const minutesLate = Math.max(0, diffMinutes - gracePeriod);
      
      return {
        isLate: minutesLate > 0,
        minutesLate: Math.round(minutesLate)
      };
    } catch (error) {
      return { isLate: false, minutesLate: 0 };
    }
  }

  private parseTime(timeStr: string): Date {
    const today = new Date();
    const [time, period] = timeStr.toUpperCase().split(/\s*(AM|PM)/);
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour24, minutes);
    return date;
  }

  private isDayRateApplicable(status: AttendanceStatus): boolean {
    return status !== 'no_show';
  }

  private calculateDeductions(status: AttendanceStatus, minutesLate: number): number {
    if (status === 'no_show') return 1.0; // 100% deduction
    if (status === 'approved_out' || status === 'work_from_home') return 0; // No deduction
    
    // Late penalty (configurable per minute)
    return minutesLate * this.defaultSettings.late_penalty_per_minute;
  }

  private extractETATime(section: string): string | undefined {
    const match = section.match(this.statusPatterns.eta_delayed);
    return match ? match[1] : undefined;
  }

  private extractApprovalCode(section: string): string | undefined {
    const match = section.match(/OUT\s*-\s*(JSP\s*Approved|[A-Z]+\s*Approved)/i);
    return match ? match[1] : undefined;
  }

  private identifyNoShowEmployees(entries: ParsedAttendanceEntry[]): string[] {
    const presentEmployeeIds = new Set(entries.map(e => e.employee_id).filter(Boolean));
    const activeEmployees = this.employees.filter(emp => emp.status === 'active');
    
    return activeEmployees
      .filter(emp => !presentEmployeeIds.has(emp.id))
      .map(emp => emp.name);
  }

  private validateEntries(entries: ParsedAttendanceEntry[]): string[] {
    const errors: string[] = [];
    
    entries.forEach(entry => {
      if (!entry.employee_id && entry.raw_name) {
        errors.push(`Unknown employee: ${entry.raw_name}`);
      }
      
      if (entry.status === 'unknown') {
        errors.push(`Could not determine status for: ${entry.raw_name}`);
      }
    });

    return errors;
  }

  private generateSummary(entries: ParsedAttendanceEntry[], noShowEmployees: string[]) {
    return {
      total_entries: entries.length,
      check_ins: entries.filter(e => e.status === 'check_in').length,
      approved_absences: entries.filter(e => e.status === 'approved_out').length,
      work_from_home: entries.filter(e => e.status === 'work_from_home').length,
      late_arrivals: entries.filter(e => e.is_late).length,
      no_shows: noShowEmployees.length,
      unmatched: entries.filter(e => !e.employee_id).length,
      total_deductions: entries.reduce((sum, e) => sum + e.deduction_amount, 0)
    };
  }
} 