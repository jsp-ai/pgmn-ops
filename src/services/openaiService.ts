export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ComputationRequest {
  type: 'payroll_calculation' | 'attendance_parsing' | 'dashboard_metrics';
  data: any;
  rules?: any;
  context?: string;
}

export interface ComputationResponse {
  success: boolean;
  result: any;
  reasoning?: string;
  error?: string;
  confidence?: number;
}

class OpenAIService {
  private config: OpenAIConfig;
  private baseURL = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.config = {
      apiKey: process.env.VITE_OPENAI_API_KEY || '',
      model: 'gpt-4-1106-preview',
      maxTokens: 4000,
      temperature: 0.1 // Low temperature for consistent calculations
    };

    if (!this.config.apiKey) {
      console.warn('OpenAI API key not found. Set VITE_OPENAI_API_KEY environment variable.');
    }
  }

  async calculatePayroll(request: ComputationRequest): Promise<ComputationResponse> {
    if (!this.config.apiKey) {
      return {
        success: false,
        result: null,
        error: 'OpenAI API key not configured'
      };
    }

    try {
      const prompt = this.buildPayrollPrompt(request);
      const response = await this.callOpenAI(prompt);
      
      return this.parsePayrollResponse(response);
    } catch (error) {
      return {
        success: false,
        result: null,
        error: `OpenAI API error: ${(error as Error).message}`
      };
    }
  }

  async parseAttendance(request: ComputationRequest): Promise<ComputationResponse> {
    if (!this.config.apiKey) {
      return {
        success: false,
        result: null,
        error: 'OpenAI API key not configured'
      };
    }

    try {
      const prompt = this.buildAttendancePrompt(request);
      const response = await this.callOpenAI(prompt);
      
      return this.parseAttendanceResponse(response);
    } catch (error) {
      return {
        success: false,
        result: null,
        error: `OpenAI API error: ${(error as Error).message}`
      };
    }
  }

  async calculateDashboardMetrics(request: ComputationRequest): Promise<ComputationResponse> {
    if (!this.config.apiKey) {
      return {
        success: false,
        result: null,
        error: 'OpenAI API key not configured'
      };
    }

    try {
      const prompt = this.buildDashboardPrompt(request);
      const response = await this.callOpenAI(prompt);
      
      return this.parseDashboardResponse(response);
    } catch (error) {
      return {
        success: false,
        result: null,
        error: `OpenAI API error: ${(error as Error).message}`
      };
    }
  }

  private async callOpenAI(prompt: string): Promise<any> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a precise payroll and attendance calculation assistant. Always return valid JSON responses with exact numerical calculations. Be consistent and accurate with all computations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned status ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  private buildPayrollPrompt(request: ComputationRequest): string {
    const { data, rules } = request;
    
    return `
Calculate payroll summaries based on the following attendance data and rules.

ATTENDANCE DATA:
${JSON.stringify(data.attendanceLogs, null, 2)}

EMPLOYEES:
${JSON.stringify(data.employees, null, 2)}

PAYROLL RULES:
${JSON.stringify(rules, null, 2)}

CALCULATION REQUIREMENTS:
1. Calculate total hours worked for each employee
2. Determine regular hours (max ${rules?.standard_work_hours || 8} hours per day)
3. Calculate overtime hours (anything over regular hours)
4. Apply late deductions for days marked as late ($${rules?.late_deduction_amount || 10} per late day)
5. Apply offline deductions for days marked as offline ($${rules?.offline_deduction_amount || 50} per offline day)
6. Calculate gross pay (regular hours × hourly rate + overtime hours × hourly rate × ${rules?.overtime_multiplier || 1.5})
7. Calculate net pay (gross pay - total deductions)

Return a JSON response with this exact structure:
{
  "success": true,
  "payrollSummaries": [
    {
      "employee": {employee object},
      "total_hours": number,
      "regular_hours": number,
      "overtime_hours": number,
      "late_days": number,
      "offline_days": number,
      "late_deductions": number,
      "offline_deductions": number,
      "gross_pay": number,
      "net_pay": number
    }
  ],
  "reasoning": "Brief explanation of calculation methodology",
  "confidence": number (0-1)
}
`;
  }

  private buildAttendancePrompt(request: ComputationRequest): string {
    const { data, rules } = request;
    
    return `
Parse Slack messages into structured attendance logs.

SLACK MESSAGES:
${JSON.stringify(data.messages, null, 2)}

EMPLOYEES:
${JSON.stringify(data.employees, null, 2)}

PARSING RULES:
- Messages with ":in:" indicate check-in
- Messages with ":out:" indicate check-out
- Standard work day starts at 9:00 AM
- Grace period: ${rules?.late_grace_period_minutes || 5} minutes
- Mark as late if check-in is after start time + grace period
- Mark as offline if no check-in and check-out for the day

Return a JSON response with this exact structure:
{
  "success": true,
  "attendanceLogs": [
    {
      "employee_id": "string",
      "date": "YYYY-MM-DD",
      "check_in": "ISO timestamp or null",
      "check_out": "ISO timestamp or null",
      "is_late": boolean,
      "is_offline": boolean,
      "hours_worked": number
    }
  ],
  "reasoning": "Brief explanation of parsing logic",
  "confidence": number (0-1)
}
`;
  }

  private buildDashboardPrompt(request: ComputationRequest): string {
    const { data } = request;
    
    return `
Calculate dashboard metrics based on current data.

PAYROLL SUMMARIES:
${JSON.stringify(data.payrollSummaries, null, 2)}

EMPLOYEES:
${JSON.stringify(data.employees, null, 2)}

SLACK MESSAGES:
${JSON.stringify(data.slackMessages, null, 2)}

Calculate and return these metrics:
1. Total active employees
2. Total messages processed
3. Total processed records (attendance logs)
4. Total late days across all employees
5. Total overtime hours across all employees
6. Total deductions amount
7. Average hours worked per employee
8. Attendance rate (percentage of employees with attendance records)

Return a JSON response with this exact structure:
{
  "success": true,
  "metrics": {
    "activeEmployeesCount": number,
    "totalMessages": number,
    "processedRecords": number,
    "totalLateDays": number,
    "totalOvertimeHours": number,
    "totalDeductions": number,
    "averageHoursWorked": number,
    "attendanceRate": number
  },
  "reasoning": "Brief explanation of calculations",
  "confidence": number (0-1)
}
`;
  }

  private parsePayrollResponse(response: any): ComputationResponse {
    try {
      if (!response.success || !response.payrollSummaries) {
        return {
          success: false,
          result: null,
          error: 'Invalid payroll calculation response from OpenAI'
        };
      }

      return {
        success: true,
        result: response.payrollSummaries,
        reasoning: response.reasoning,
        confidence: response.confidence || 0.9
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: 'Failed to parse payroll calculation response'
      };
    }
  }

  private parseAttendanceResponse(response: any): ComputationResponse {
    try {
      if (!response.success || !response.attendanceLogs) {
        return {
          success: false,
          result: null,
          error: 'Invalid attendance parsing response from OpenAI'
        };
      }

      return {
        success: true,
        result: response.attendanceLogs,
        reasoning: response.reasoning,
        confidence: response.confidence || 0.9
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: 'Failed to parse attendance response'
      };
    }
  }

  private parseDashboardResponse(response: any): ComputationResponse {
    try {
      if (!response.success || !response.metrics) {
        return {
          success: false,
          result: null,
          error: 'Invalid dashboard metrics response from OpenAI'
        };
      }

      return {
        success: true,
        result: response.metrics,
        reasoning: response.reasoning,
        confidence: response.confidence || 0.9
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: 'Failed to parse dashboard metrics response'
      };
    }
  }

  // Test the OpenAI connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.config.apiKey) {
      return { success: false, error: 'No API key configured' };
    }

    try {
      await this.callOpenAI('Test calculation: What is 2 + 2? Return JSON with {"result": number}.');
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const openaiService = new OpenAIService(); 